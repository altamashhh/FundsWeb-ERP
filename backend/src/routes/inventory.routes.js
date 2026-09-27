import express from "express";

import {
    getInventory,
    getInventoryByProduct,
    createInventory,
    reserveInventory,
} from "../controllers/inventory.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, getInventory);

router.get("/:productId", authenticate, getInventoryByProduct);

router.post("/", authenticate, createInventory);

// RESERVE INVENTORY FOR SALES ORDER
router.post(
    "/reserve/:salesOrderId",
    authenticate,
    reserveInventory
);

export default router;