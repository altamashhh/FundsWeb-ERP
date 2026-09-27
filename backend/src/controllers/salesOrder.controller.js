import prisma from "../config/prisma.js";

// CREATE SALES ORDER
export const createSalesOrder = async (req, res) => {
    try {
        const { quotationId } = req.body;

        // Basic validation
        if (!quotationId) {
            return res.status(400).json({
                success: false,
                message: "Quotation ID is required",
            });
        }

        // Find quotation
        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId,
            },
            include: {
                items: true,
            },
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found",
            });
        }

        // Only ACCEPTED quotations can become sales orders
        if (quotation.status !== "ACCEPTED") {
            return res.status(400).json({
                success: false,
                message: "Only accepted quotations can be converted to sales orders",
            });
        }

        // Check if sales order already exists
        const existingOrder = await prisma.salesOrder.findUnique({
            where: {
                quotationId,
            },
        });

        if (existingOrder) {
            return res.status(409).json({
                success: false,
                message: "Sales order already exists for this quotation",
                data: existingOrder,
            });
        }

        // Generate order number
        const orderNumber = `SO-${Date.now()}`;

        // Create sales order
        const salesOrder = await prisma.salesOrder.create({
            data: {
                orderNumber,
                customerId: quotation.customerId,
                quotationId: quotation.id,
                totalAmount: quotation.grandTotal,

                items: {
                    create: quotation.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },

            include: {
                customer: true,
                quotation: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Sales order created successfully",
            data: salesOrder,
        });
    } catch (error) {
        console.error("Create sales order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create sales order",
            error: error.message,
        });
    }
};

// GET ALL SALES ORDERS
export const getSalesOrders = async (req, res) => {
    try {
        const salesOrders = await prisma.salesOrder.findMany({
            include: {
                customer: true,
                quotation: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: salesOrders,
        });
    } catch (error) {
        console.error("Get sales orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sales orders",
            error: error.message,
        });
    }
};

// GET SALES ORDER BY ID
export const getSalesOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const salesOrder = await prisma.salesOrder.findUnique({
            where: {
                id,
            },
            include: {
                customer: true,
                quotation: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!salesOrder) {
            return res.status(404).json({
                success: false,
                message: "Sales order not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: salesOrder,
        });
    } catch (error) {
        console.error("Get sales order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sales order",
            error: error.message,
        });
    }
};

// UPDATE SALES ORDER STATUS
export const updateSalesOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = [
            "PENDING",
            "CONFIRMED",
            "DISPATCHED",
            "CANCELLED",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sales order status",
            });
        }

        // Get sales order with items
        const existingOrder = await prisma.salesOrder.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
            },
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Sales order not found",
            });
        }

        // Prevent unnecessary status update
        if (existingOrder.status === status) {
            return res.status(400).json({
                success: false,
                message: `Sales order is already ${status}`,
            });
        }

        /*
         * =====================================================
         * CONFIRM ORDER
         * =====================================================
         *
         * When PENDING -> CONFIRMED:
         * Reserve the required quantity from inventory.
         */
        if (
            existingOrder.status === "PENDING" &&
            status === "CONFIRMED"
        ) {
            await prisma.$transaction(async (tx) => {
                // Check inventory for every product
                for (const item of existingOrder.items) {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            productId: item.productId,
                        },
                    });

                    if (!inventory) {
                        throw new Error(
                            `Inventory not found for product ${item.productId}`
                        );
                    }

                    const availableQuantity =
                        inventory.physicalQuantity -
                        inventory.reservedQuantity;

                    if (availableQuantity < item.quantity) {
                        throw new Error(
                            `Insufficient stock for product ${item.productId}. Available: ${availableQuantity}, Required: ${item.quantity}`
                        );
                    }
                }

                // Reserve stock
                for (const item of existingOrder.items) {
                    await tx.inventory.update({
                        where: {
                            productId: item.productId,
                        },
                        data: {
                            reservedQuantity: {
                                increment: item.quantity,
                            },
                        },
                    });
                }

                // Confirm order
                await tx.salesOrder.update({
                    where: {
                        id,
                    },
                    data: {
                        status: "CONFIRMED",
                    },
                });
            });
        }

        /*
         * =====================================================
         * CANCEL ORDER
         * =====================================================
         *
         * When CONFIRMED -> CANCELLED:
         * Release previously reserved stock.
         */
        else if (
            existingOrder.status === "CONFIRMED" &&
            status === "CANCELLED"
        ) {
            await prisma.$transaction(async (tx) => {
                // Release reserved stock
                for (const item of existingOrder.items) {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            productId: item.productId,
                        },
                    });

                    if (!inventory) {
                        throw new Error(
                            `Inventory not found for product ${item.productId}`
                        );
                    }

                    if (inventory.reservedQuantity < item.quantity) {
                        throw new Error(
                            `Reserved quantity is insufficient for product ${item.productId}`
                        );
                    }

                    await tx.inventory.update({
                        where: {
                            productId: item.productId,
                        },
                        data: {
                            reservedQuantity: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }

                // Cancel order
                await tx.salesOrder.update({
                    where: {
                        id,
                    },
                    data: {
                        status: "CANCELLED",
                    },
                });
            });
        }

        /*
         * =====================================================
         * OTHER STATUS CHANGES
         * =====================================================
         *
         * For now, simply update the status.
         * Dispatch/inventory deduction will be handled
         * when we build the Dispatch module.
         */
        else {
            await prisma.salesOrder.update({
                where: {
                    id,
                },
                data: {
                    status,
                },
            });
        }

        // Fetch updated sales order
        const salesOrder = await prisma.salesOrder.findUnique({
            where: {
                id,
            },
            include: {
                customer: true,
                quotation: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Sales order status updated successfully",
            data: salesOrder,
        });
    } catch (error) {
        console.error("Update sales order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update sales order status",
            error: error.message,
        });
    }
};