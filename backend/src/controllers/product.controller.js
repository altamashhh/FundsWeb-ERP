import prisma from "../config/prisma.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
    try {
        const {
            productCode,
            productName,
            category,
            unit,
            basePrice,
        } = req.body;

        if (
            !productCode ||
            !productName ||
            !category ||
            !unit ||
            basePrice === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All product fields are required",
            });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { productCode },
        });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product code already exists",
            });
        }

        const product = await prisma.product.create({
            data: {
                productCode,
                productName,
                category,
                unit,
                basePrice,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        });
    }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message,
        });
    }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            productCode,
            productName,
            category,
            unit,
            basePrice,
        } = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (productCode && productCode !== existingProduct.productCode) {
            const duplicateProduct = await prisma.product.findUnique({
                where: { productCode },
            });

            if (duplicateProduct) {
                return res.status(409).json({
                    success: false,
                    message: "Product code already exists",
                });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(productCode !== undefined && { productCode }),
                ...(productName !== undefined && { productName }),
                ...(category !== undefined && { category }),
                ...(unit !== undefined && { unit }),
                ...(basePrice !== undefined && { basePrice }),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message,
        });
    }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await prisma.product.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message,
        });
    }
};