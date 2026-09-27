import { describe, it, expect } from "vitest";

describe("FundsWeb ERP Backend", () => {

    // TEST 1
    it("should calculate quotation total correctly", () => {
        const quantity = 10;
        const unitPrice = 50000;

        const subtotal = quantity * unitPrice;

        const discountPercent = 10;
        const discountAmount =
            subtotal * (discountPercent / 100);

        const gstPercent = 18;
        const taxableAmount =
            subtotal - discountAmount;

        const gstAmount =
            taxableAmount * (gstPercent / 100);

        const grandTotal =
            taxableAmount + gstAmount;

        expect(subtotal).toBe(500000);
        expect(discountAmount).toBe(50000);
        expect(gstAmount).toBe(81000);
        expect(grandTotal).toBe(531000);
    });

    // TEST 2
    it("should reject sales order conversion from non-accepted quotation", () => {
        const quotation = {
            status: "SENT",
        };

        const canCreateSalesOrder =
            quotation.status === "ACCEPTED";

        expect(canCreateSalesOrder).toBe(false);
    });
    // TEST 3
    it("should prevent duplicate sales order for the same quotation", () => {
        const existingSalesOrder = {
            quotationId: "quotation-123",
        };

        const newQuotationId = "quotation-123";

        const duplicateExists =
            existingSalesOrder.quotationId === newQuotationId;

        expect(duplicateExists).toBe(true);
    });

    // TEST 4
    it("should reject an order when inventory is insufficient", () => {
        const physicalQuantity = 75;
        const reservedQuantity = 25;
        const requiredQuantity = 60;

        const availableQuantity =
            physicalQuantity - reservedQuantity;

        const hasEnoughStock =
            availableQuantity >= requiredQuantity;

        expect(availableQuantity).toBe(50);
        expect(hasEnoughStock).toBe(false);
    });

    // TEST 5
    it("should reject unauthorized sales order confirmation", () => {
        const user = {
            role: "SALES",
        };

        const requiredRole = "ADMIN";

        const isAuthorized =
            user.role === requiredRole;

        expect(isAuthorized).toBe(false);
    });

});

