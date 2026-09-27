import prisma from "../config/prisma.js";

// GET ALL INVENTORY
export const getInventory = async (req, res) => {
    try {
        const inventory = await prisma.inventory.findMany({
            include: {
                product: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: inventory,
        });
    } catch (error) {
        console.error("Get inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inventory",
            error: error.message,
        });
    }
};

// GET INVENTORY BY PRODUCT
export const getInventoryByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const inventory = await prisma.inventory.findUnique({
            where: {
                productId,
            },
            include: {
                product: true,
            },
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found for this product",
            });
        }

        return res.status(200).json({
            success: true,
            data: inventory,
        });
    } catch (error) {
        console.error("Get inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inventory",
            error: error.message,
        });
    }
};

// CREATE / INITIALIZE INVENTORY
export const createInventory = async (req, res) => {
    try {
        const { productId, physicalQuantity } = req.body;

        if (!productId || physicalQuantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product and physical quantity are required",
            });
        }

        if (physicalQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Physical quantity cannot be negative",
            });
        }

        // Check product exists
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Prevent duplicate inventory
        const existingInventory = await prisma.inventory.findUnique({
            where: {
                productId,
            },
        });

        if (existingInventory) {
            return res.status(409).json({
                success: false,
                message: "Inventory already exists for this product",
            });
        }

        const inventory = await prisma.inventory.create({
            data: {
                productId,
                physicalQuantity,
                reservedQuantity: 0,
            },
            include: {
                product: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Inventory created successfully",
            data: inventory,
        });
    } catch (error) {
        console.error("Create inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create inventory",
            error: error.message,
        });
    }
};

// RESERVE INVENTORY FOR SALES ORDER
export const reserveInventory = async (req, res) => {
    try {
        const { salesOrderId } = req.params;

        const updatedInventory = await prisma.$transaction(async (tx) => {
            // Lock the sales order row so two requests cannot reserve
            // the same sales order simultaneously.
            const salesOrders = await tx.$queryRaw`
                SELECT *
                FROM "SalesOrder"
                WHERE "id" = ${salesOrderId}
                FOR UPDATE
            `;

            if (salesOrders.length === 0) {
                const error = new Error("Sales order not found");
                error.statusCode = 404;
                throw error;
            }

            const salesOrder = salesOrders[0];

            // Only confirmed orders can reserve inventory
            if (salesOrder.status !== "CONFIRMED") {
                const error = new Error(
                    "Only confirmed sales orders can reserve inventory"
                );
                error.statusCode = 400;
                throw error;
            }

            // Prevent duplicate reservation
            if (salesOrder.inventoryReserved) {
                const error = new Error(
                    "Inventory has already been reserved for this sales order"
                );
                error.statusCode = 400;
                throw error;
            }

            // Get sales order items
            const items = await tx.salesOrderItem.findMany({
                where: {
                    salesOrderId,
                },
            });

            if (items.length === 0) {
                const error = new Error(
                    "Sales order has no items"
                );
                error.statusCode = 400;
                throw error;
            }

            // Lock and reserve every inventory row
            for (const item of items) {
                const inventoryRows = await tx.$queryRaw`
                    SELECT *
                    FROM "Inventory"
                    WHERE "productId" = ${item.productId}
                    FOR UPDATE
                `;

                if (inventoryRows.length === 0) {
                    const error = new Error(
                        `Inventory not found for product ${item.productId}`
                    );
                    error.statusCode = 404;
                    throw error;
                }

                const inventory = inventoryRows[0];

                const availableQuantity =
                    inventory.physicalQuantity -
                    inventory.reservedQuantity;

                // Check available stock
                if (availableQuantity < item.quantity) {
                    const error = new Error(
                        `Insufficient inventory for product ${item.productId}`
                    );

                    error.statusCode = 400;
                    error.availableQuantity = availableQuantity;
                    error.requiredQuantity = item.quantity;

                    throw error;
                }

                // Reserve inventory
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

            // Mark sales order as reserved
            await tx.salesOrder.update({
                where: {
                    id: salesOrderId,
                },
                data: {
                    inventoryReserved: true,
                },
            });

            // Return updated inventory
            return await tx.inventory.findMany({
                where: {
                    productId: {
                        in: items.map(
                            (item) => item.productId
                        ),
                    },
                },
                include: {
                    product: true,
                },
            });
        });

        return res.status(200).json({
            success: true,
            message: "Inventory reserved successfully",
            data: updatedInventory,
        });
    } catch (error) {
        console.error("Reserve inventory error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to reserve inventory",
            ...(error.availableQuantity !== undefined && {
                availableQuantity:
                    Number(error.availableQuantity),
            }),
            ...(error.requiredQuantity !== undefined && {
                requiredQuantity:
                    Number(error.requiredQuantity),
            }),
        });
    }
};