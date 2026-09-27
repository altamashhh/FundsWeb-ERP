import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import salesOrderRoutes from "./routes/salesOrder.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FundsWeb ERP API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/admin", adminRoutes);



export default app;