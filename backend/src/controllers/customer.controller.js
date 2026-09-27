import prisma from "../config/prisma.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
    try {
        const {
            companyName,
            contactPerson,
            mobile,
            email,
            city,
        } = req.body;

        if (!companyName || !contactPerson || !mobile || !email || !city) {
            return res.status(400).json({
                success: false,
                message: "All customer fields are required",
            });
        }

        const customer = await prisma.customer.create({
            data: {
                companyName,
                contactPerson,
                mobile,
                email,
                city,
            },
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer",
        });
    }
};


// GET ALL CUSTOMERS
export const getCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: customers,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
};


// GET CUSTOMER BY ID
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({
            where: {
                id,
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer",
        });
    }
};


// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            companyName,
            contactPerson,
            mobile,
            email,
            city,
        } = req.body;

        const existingCustomer = await prisma.customer.findUnique({
            where: {
                id,
            },
        });

        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const customer = await prisma.customer.update({
            where: {
                id,
            },
            data: {
                companyName,
                contactPerson,
                mobile,
                email,
                city,
            },
        });

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update customer",
        });
    }
};


// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCustomer = await prisma.customer.findUnique({
            where: {
                id,
            },
        });

        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        await prisma.customer.delete({
            where: {
                id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete customer",
        });
    }
};