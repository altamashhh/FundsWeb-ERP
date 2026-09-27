import express from "express";

import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customer.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();


// Create customer
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SALES"),
    createCustomer
);


// Get all customers
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "SALES"),
    getCustomers
);


// Get customer by ID
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "SALES"),
    getCustomerById
);


// Update customer
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN", "SALES"),
    updateCustomer
);


// Delete customer
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    deleteCustomer
);


export default router;