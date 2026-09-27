import prisma from "../config/prisma.js";

// CREATE ENQUIRY
export const createEnquiry = async (req, res) => {
    try {
        const { customerId, requiredDate, notes, items } = req.body;

        // Basic validation
        if (!customerId || !requiredDate || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Customer, required date and at least one item are required",
            });
        }

        // Generate enquiry number
        const enquiryNumber = `ENQ-${Date.now()}`;

        const enquiry = await prisma.enquiry.create({
            data: {
                enquiryNumber,
                customerId,
                createdById: req.user.id,
                requiredDate: new Date(requiredDate),
                notes: notes || null,

                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                customer: true,
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
            message: "Enquiry created successfully",
            data: enquiry,
        });
    } catch (error) {
        console.error("Create enquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create enquiry",
            error: error.message,
        });
    }
};
// GET ALL ENQUIRIES
export const getEnquiries = async (req, res) => {
    try {
        const enquiries = await prisma.enquiry.findMany({
            include: {
                customer: true,

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
            data: enquiries,
        });
    } catch (error) {
        console.error("Get enquiries error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch enquiries",
            error: error.message,
        });
    }
};
// GET SINGLE ENQUIRY
export const getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await prisma.enquiry.findUnique({
            where: {
                id,
            },
            include: {
                customer: true,

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

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: enquiry,
        });
    } catch (error) {
        console.error("Get enquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch enquiry",
            error: error.message,
        });
    }
};
// UPDATE ENQUIRY STATUS
export const updateEnquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ["NEW", "QUOTED", "WON", "LOST"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry status",
            });
        }

        // Check enquiry exists
        const existingEnquiry = await prisma.enquiry.findUnique({
            where: {
                id,
            },
        });

        if (!existingEnquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        // Update status
        const enquiry = await prisma.enquiry.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Enquiry status updated successfully",
            data: enquiry,
        });
    } catch (error) {
        console.error("Update enquiry status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update enquiry status",
            error: error.message,
        });
    }
};