import prisma from "../config/prisma.js";

// CREATE DISPATCH
export const createDispatch = async (req, res) => {
    try {
        const {
            salesOrderId,
            vehicleNumber,
            driverName,
            items,
        } = req.body;

        // Basic validation
        if (
            !salesOrderId ||
            !vehicleNumber ||
            !driverName ||
            !items ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Sales order, vehicle number, driver name and at least one item are required",
            });
        }

        // Find sales order
        const salesOrder = await prisma.salesOrder.findUnique({
            where: {
                id: salesOrderId,
            },
            include: {
                items: true,
            },
        });

        if (!salesOrder) {
            return res.status(404).json({
                success: false,
                message: "Sales order not found",
            });
        }

        // Only confirmed orders can be dispatched
        if (salesOrder.status !== "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message:
                    "Only confirmed sales orders can be dispatched",
            });
        }

        // Inventory must be reserved first
        if (!salesOrder.inventoryReserved) {
            return res.status(400).json({
                success: false,
                message:
                    "Inventory must be reserved before dispatch",
            });
        }

        // Check whether dispatch already exists
        const existingDispatch = await prisma.dispatch.findFirst({
            where: {
                salesOrderId,
            },
        });

        if (existingDispatch) {
            return res.status(409).json({
                success: false,
                message:
                    "Dispatch already exists for this sales order",
                data: existingDispatch,
            });
        }

        // Validate dispatch items
        for (const item of items) {
            const salesOrderItem = salesOrder.items.find(
                (orderItem) =>
                    orderItem.productId === item.productId
            );

            if (!salesOrderItem) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Product ${item.productId} is not part of the sales order`,
                });
            }

            if (!item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Dispatch quantity must be greater than zero",
                });
            }

            if (item.quantity > salesOrderItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Dispatch quantity cannot exceed ordered quantity for product ${item.productId}`,
                });
            }
        }

        // Generate dispatch number
        const dispatchNumber = `DSP-${Date.now()}`;

        // DATABASE TRANSACTION
        const dispatch = await prisma.$transaction(async (tx) => {

            // Create dispatch
            const newDispatch = await tx.dispatch.create({
                data: {
                    dispatchNumber,
                    salesOrderId,
                    vehicleNumber,
                    driverName,

                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                    },
                },
                include: {
                    salesOrder: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Update inventory
            for (const item of items) {
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

                // Available reserved quantity
                if (
                    inventory.reservedQuantity <
                    item.quantity
                ) {
                    throw new Error(
                        `Reserved inventory is insufficient for product ${item.productId}`
                    );
                }

                // Deduct physical stock
                // and release reserved stock
                await tx.inventory.update({
                    where: {
                        productId: item.productId,
                    },
                    data: {
                        physicalQuantity: {
                            decrement: item.quantity,
                        },
                        reservedQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Mark sales order as dispatched
            await tx.salesOrder.update({
                where: {
                    id: salesOrderId,
                },
                data: {
                    status: "DISPATCHED",
                },
            });

            return newDispatch;
        });

        return res.status(201).json({
            success: true,
            message: "Dispatch created successfully",
            data: dispatch,
        });

    } catch (error) {
        console.error("Create dispatch error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create dispatch",
            error: error.message,
        });
    }
};