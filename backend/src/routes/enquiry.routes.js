import express from "express";

import {
    createEnquiry,
    getEnquiries,
    getEnquiryById,
    updateEnquiryStatus,
} from "../controllers/enquiry.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createEnquiry);

router.get("/", authenticate, getEnquiries);
router.get("/:id", authenticate, getEnquiryById);

router.put("/:id/status", authenticate, updateEnquiryStatus);

export default router;