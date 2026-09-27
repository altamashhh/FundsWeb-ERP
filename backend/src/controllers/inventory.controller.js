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

        // Only confirmed orders can reserve inventory
        if (salesOrder.status !== "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message: "Only confirmed sales orders can reserve inventory",
            });
        }

        // Prevent duplicate inventory reservation
        if (salesOrder.inventoryReserved) {
            return res.status(400).json({
                success: false,
                message: "Inventory has already been reserved for this sales order",
            });
        }

        // Reserve each sales order item
        for (const item of salesOrder.items) {
            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId: item.productId,
                },
            });

            if (!inventory) {
                return res.status(404).json({
                    success: false,
                    message: `Inventory not found for product ${item.productId}`,
                });
            }

            // Calculate available quantity
            const availableQuantity =
                inventory.physicalQuantity -
                inventory.reservedQuantity;

            // Check stock
            if (availableQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient inventory for product ${item.productId}`,
                    availableQuantity,
                    requiredQuantity: item.quantity,
                });
            }

            // Reserve inventory
            await prisma.inventory.update({
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

        // Mark sales order as inventory reserved
        await prisma.salesOrder.update({
            where: {
                id: salesOrderId,
            },
            data: {
                inventoryReserved: true,
            },
        });

        // Get updated inventory
        const updatedInventory = await prisma.inventory.findMany({
            where: {
                productId: {
                    in: salesOrder.items.map(
                        (item) => item.productId
                    ),
                },
            },
            include: {
                product: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Inventory reserved successfully",
            data: updatedInventory,
        });
    } catch (error) {
        console.error("Reserve inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to reserve inventory",
            error: error.message,
        });
    }
};