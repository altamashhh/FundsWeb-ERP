import express from "express";

import {
    createSalesOrder,
    getSalesOrders,
    getSalesOrderById,
    updateSalesOrderStatus
} from "../controllers/salesOrder.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createSalesOrder);
router.get("/", authenticate, getSalesOrders);
router.get("/:id", authenticate, getSalesOrderById);
router.put("/:id/status", authenticate, updateSalesOrderStatus);

export default router;