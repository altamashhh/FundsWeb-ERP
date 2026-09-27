import express from "express";

import {
    createDispatch,
} from "../controllers/dispatch.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createDispatch);

export default router;