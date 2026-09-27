import prisma from "../config/prisma.js";


// CREATE QUOTATION
export const createQuotation = async (req, res) => {
    try {
        const { enquiryId, validUntil, items } = req.body;

        // Basic validation
        if (!enquiryId || !validUntil || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Enquiry, valid until date and at least one item are required",
            });
        }

        // Find enquiry
        const enquiry = await prisma.enquiry.findUnique({
            where: {
                id: enquiryId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        // Generate quotation number
        const quotationNumber = `QUO-${Date.now()}`;

        // Prepare quotation items
        const quotationItems = items.map((item) => {
            const enquiryItem = enquiry.items.find(
                (enquiryItem) => enquiryItem.productId === item.productId
            );

            if (!enquiryItem) {
                throw new Error(
                    `Product ${item.productId} is not present in the enquiry`
                );
            }

            const quantity = item.quantity ?? enquiryItem.quantity;

            const unitPrice = Number(enquiryItem.product.basePrice);

            const discountPct = Number(item.discountPct || 0);

            const gstPct = Number(item.gstPct || 0);

            const grossAmount = unitPrice * quantity;

            const discountAmount =
                grossAmount * (discountPct / 100);

            const taxableAmount =
                grossAmount - discountAmount;

            const gstAmount =
                taxableAmount * (gstPct / 100);

            const lineAmount =
                taxableAmount + gstAmount;

            return {
                productId: item.productId,
                quantity,
                unitPrice,
                discountPct,
                gstPct,
                lineAmount,
            };
        });

        // Calculate totals
        const subtotal = quotationItems.reduce(
            (sum, item) =>
                sum + item.unitPrice * item.quantity,
            0
        );

        const discountAmount = quotationItems.reduce(
            (sum, item) => {
                const gross =
                    item.unitPrice * item.quantity;

                return sum + gross * (item.discountPct / 100);
            },
            0
        );

        const taxableAmount =
            subtotal - discountAmount;

        const gstAmount = quotationItems.reduce(
            (sum, item) => {
                const gross =
                    item.unitPrice * item.quantity;

                const discount =
                    gross * (item.discountPct / 100);

                const taxable =
                    gross - discount;

                return sum + taxable * (item.gstPct / 100);
            },
            0
        );

        const grandTotal =
            taxableAmount + gstAmount;

        // Create quotation
        const quotation = await prisma.quotation.create({
            data: {
                quotationNumber,

                enquiry: {
                    connect: {
                        id: enquiryId,
                    },
                },

                customer: {
                    connect: {
                        id: enquiry.customerId,
                    },
                },

                createdBy: {
                    connect: {
                        id: req.user.id,
                    },
                },

                validUntil: new Date(validUntil),

                status: "DRAFT",

                subtotal,
                discountAmount,
                gstAmount,
                grandTotal,

                items: {
                    create: quotationItems,
                },
            },

            include: {
                customer: true,

                enquiry: true,

                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Quotation created successfully",
            data: quotation,
        });
    } catch (error) {
        console.error("Create quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create quotation",
            error: error.message,
        });
    }
};
// GET ALL QUOTATIONS
export const getQuotations = async (req, res) => {
    try {
        const quotations = await prisma.quotation.findMany({
            include: {
                customer: true,
                enquiry: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
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
            data: quotations,
        });
    } catch (error) {
        console.error("Get quotations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotations",
            error: error.message,
        });
    }
};

// GET QUOTATION BY ID
export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;

        const quotation = await prisma.quotation.findUnique({
            where: {
                id,
            },
            include: {
                customer: true,
                enquiry: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: quotation,
        });

    } catch (error) {
        console.error("Get quotation by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotation",
            error: error.message,
        });
    }
};

// UPDATE QUOTATION STATUS
export const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            "DRAFT",
            "SENT",
            "ACCEPTED",
            "REJECTED",
        ];

        // Validate status
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation status",
            });
        }

        // Check quotation exists
        const existingQuotation = await prisma.quotation.findUnique({
            where: {
                id,
            },
        });

        if (!existingQuotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found",
            });
        }

        // Update status
        const quotation = await prisma.quotation.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Quotation status updated successfully",
            data: quotation,
        });

    } catch (error) {
        console.error("Update quotation status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update quotation status",
            error: error.message,
        });
    }
};