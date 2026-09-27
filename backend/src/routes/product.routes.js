import express from "express";

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createProduct
);

router.get(
    "/",
    authenticate,
    getProducts
);

router.get(
    "/:id",
    authenticate,
    getProductById
);

router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    updateProduct
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    deleteProduct
);

export default router;