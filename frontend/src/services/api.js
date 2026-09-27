const API_BASE_URL = "http://localhost:5000/api";

function getToken() {
    return localStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
            ...(options.headers || {}),
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Something went wrong"
        );
    }

    return result;
}

// ─── INVENTORY ────────────────────────────────────────────
export async function getInventory() {
    return apiRequest("/inventory");
}

export async function getInventoryByProduct(productId) {
    return apiRequest(`/inventory/${productId}`);
}

// ─── CUSTOMERS ────────────────────────────────────────────
export async function getCustomers() {
    return apiRequest("/customers");
}

// ─── PRODUCTS ─────────────────────────────────────────────
export async function getProducts() {
    return apiRequest("/products");
}

// ─── ENQUIRIES ────────────────────────────────────────────
export async function getEnquiries() {
    return apiRequest("/enquiries");
}

export async function getEnquiryById(id) {
    return apiRequest(`/enquiries/${id}`);
}

export async function createEnquiry(data) {
    return apiRequest("/enquiries", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateEnquiryStatus(id, status) {
    return apiRequest(`/enquiries/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });
}

// ─── QUOTATIONS ───────────────────────────────────────────
export async function getQuotations() {
    return apiRequest("/quotations");
}

export async function getQuotationById(id) {
    return apiRequest(`/quotations/${id}`);
}

export async function createQuotation(data) {
    return apiRequest("/quotations", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateQuotationStatus(id, status) {
    return apiRequest(`/quotations/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });
}

// ─── SALES ORDERS ─────────────────────────────────────────
export async function getSalesOrders() {
    return apiRequest("/sales-orders");
}

export async function getSalesOrderById(id) {
    return apiRequest(`/sales-orders/${id}`);
}

export async function createSalesOrder(data) {
    return apiRequest("/sales-orders", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateSalesOrderStatus(id, status) {
    return apiRequest(`/sales-orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });
}

// ─── DISPATCH ─────────────────────────────────────────────
export async function createDispatch(data) {
    return apiRequest("/dispatches", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export default apiRequest;