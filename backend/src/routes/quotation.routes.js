import express from "express";

import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotationStatus,
} from "../controllers/quotation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createQuotation);

router.get("/", authenticate, getQuotations);

router.get("/:id", authenticate, getQuotationById);

router.put("/:id/status", authenticate, updateQuotationStatus);

export default router;