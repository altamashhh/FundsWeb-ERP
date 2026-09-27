import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    getSalesOrders,
    createSalesOrder,
    updateSalesOrderStatus,
    getQuotations,
    getInventory,
    createDispatch,
} from "../services/api";
import "../App.css";

const ORDER_STATUS_COLORS = {
    PENDING: { bg: "#fefce8", color: "#a16207" },
    CONFIRMED: { bg: "#eff6ff", color: "#1d4ed8" },
    DISPATCHED: { bg: "#dcfce7", color: "#15803d" },
    CANCELLED: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
    const s = ORDER_STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569" };
    return (
        <span style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            background: s.bg,
            color: s.color,
        }}>
            {status}
        </span>
    );
}

function SalesOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Inventory summary
    const [inventory, setInventory] = useState([]);

    // Create order modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [acceptedQuotations, setAcceptedQuotations] = useState([]);
    const [selectedQuotationId, setSelectedQuotationId] = useState("");
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState("");

    // Confirm modal
    const [confirmingId, setConfirmingId] = useState(null);

    // Dispatch modal
    const [dispatchOrder, setDispatchOrder] = useState(null);
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [driverName, setDriverName] = useState("");
    const [dispatchItems, setDispatchItems] = useState([]);
    const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
    const [dispatchError, setDispatchError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError("");
            const [ordersRes, invRes] = await Promise.all([
                getSalesOrders(),
                getInventory(),
            ]);
            setOrders(ordersRes.data || []);
            setInventory(invRes.data || []);
        } catch (err) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // ─── CREATE SALES ORDER ────────────────────────────────
    const openCreateModal = async () => {
        setCreateError("");
        setSelectedQuotationId("");
        setShowCreateModal(true);

        try {
            const quotRes = await getQuotations();
            const allQuotations = quotRes.data || [];
            // Filter to ACCEPTED quotations that don't already have a sales order
            const existingQuotationIds = new Set(
                orders.map((o) => o.quotation?.id || o.quotationId)
            );
            const eligible = allQuotations.filter(
                (q) => q.status === "ACCEPTED" && !existingQuotationIds.has(q.id)
            );
            setAcceptedQuotations(eligible);
        } catch (err) {
            setCreateError("Failed to load quotations: " + err.message);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setCreateError("");
        if (!selectedQuotationId) {
            setCreateError("Please select an accepted quotation.");
            return;
        }
        try {
            setCreateSubmitting(true);
            await createSalesOrder({ quotationId: selectedQuotationId });
            setShowCreateModal(false);
            fetchAll();
        } catch (err) {
            setCreateError(err.message || "Failed to create sales order");
        } finally {
            setCreateSubmitting(false);
        }
    };

    // ─── CONFIRM ORDER ─────────────────────────────────────
    const handleConfirm = async (id) => {
        if (!window.confirm("Confirm this sales order? This will reserve inventory.")) return;
        try {
            setConfirmingId(id);
            await updateSalesOrderStatus(id, "CONFIRMED");
            fetchAll();
        } catch (err) {
            alert("Failed to confirm order: " + err.message);
        } finally {
            setConfirmingId(null);
        }
    };

    // ─── CANCEL ORDER ──────────────────────────────────────
    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this sales order? Reserved inventory will be released.")) return;
        try {
            await updateSalesOrderStatus(id, "CANCELLED");
            fetchAll();
        } catch (err) {
            alert("Failed to cancel order: " + err.message);
        }
    };

    // ─── DISPATCH MODAL ────────────────────────────────────
    const openDispatchModal = (order) => {
        setDispatchOrder(order);
        setVehicleNumber("");
        setDriverName("");
        setDispatchError("");
        setDispatchItems(
            (order.items || []).map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                productName: i.product?.productName || i.productId,
            }))
        );
    };

    const updateDispatchItem = (index, value) => {
        const updated = dispatchItems.map((item, i) =>
            i === index ? { ...item, quantity: value } : item
        );
        setDispatchItems(updated);
    };

    const handleDispatch = async (e) => {
        e.preventDefault();
        setDispatchError("");
        if (!vehicleNumber || !driverName) {
            setDispatchError("Vehicle number and driver name are required.");
            return;
        }
        try {
            setDispatchSubmitting(true);
            await createDispatch({
                salesOrderId: dispatchOrder.id,
                vehicleNumber,
                driverName,
                items: dispatchItems.map((i) => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                })),
            });
            setDispatchOrder(null);
            fetchAll();
        } catch (err) {
            setDispatchError(err.message || "Failed to dispatch");
        } finally {
            setDispatchSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        const num = parseFloat(val);
        return isNaN(num)
            ? "₹0.00"
            : "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    };

    // Inventory totals
    const totalPhysical = inventory.reduce((t, i) => t + Number(i.physicalQuantity || 0), 0);
    const totalReserved = inventory.reduce((t, i) => t + Number(i.reservedQuantity || 0), 0);
    const totalAvailable = totalPhysical - totalReserved;

    return (
        <div className="erp-page">

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>Sales Orders</h1>
                    <p>Manage sales orders and order fulfilment.</p>
                </div>
                <Link to="/dashboard" className="back-button">← Dashboard</Link>
            </div>

            {/* ACTIONS */}
            <div className="page-actions">
                <button className="primary-button" onClick={openCreateModal}>
                    + New Sales Order
                </button>
            </div>

            {/* INVENTORY SUMMARY */}
            <div className="inventory-summary">
                <div className="inventory-card">
                    <span>Physical Stock</span>
                    <strong>{loading ? "..." : totalPhysical}</strong>
                </div>
                <div className="inventory-card">
                    <span>Reserved Stock</span>
                    <strong>{loading ? "..." : totalReserved}</strong>
                </div>
                <div className="inventory-card available">
                    <span>Available Stock</span>
                    <strong>{loading ? "..." : totalAvailable}</strong>
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="table-card">
                <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2>Sales Orders</h2>
                        <p>Orders generated from accepted quotations</p>
                    </div>
                    <button className="primary-button" onClick={fetchAll} disabled={loading}>
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </div>

                {error && (
                    <div style={{ margin: "20px 24px", padding: "14px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="empty-table">
                        <div className="empty-table-icon">S</div>
                        <h3>Loading sales orders...</h3>
                        <p>Fetching the latest order records.</p>
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="empty-table">
                        <div className="empty-table-icon">S</div>
                        <h3>No sales orders found</h3>
                        <p>Accepted quotations can be converted into sales orders.</p>
                        <button className="primary-button" onClick={openCreateModal}>+ Create Sales Order</button>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <div style={{ overflowX: "auto", padding: "0 24px 24px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                            <thead>
                                <tr>
                                    {["Order #", "Quotation #", "Customer", "Order Date", "Total Amount", "Status", "Inv. Reserved", "Actions"].map((h) => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: "#2563eb" }}>{order.orderNumber}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            {order.quotation?.quotationNumber || "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{order.customer?.companyName || "-"}</div>
                                            <div style={{ fontSize: 12, color: "#64748b" }}>{order.customer?.contactPerson}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            <strong>{formatCurrency(order.totalAmount)}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>
                                            {order.inventoryReserved ? (
                                                <span style={{ color: "#15803d", fontWeight: 600 }}>✓ Yes</span>
                                            ) : (
                                                <span style={{ color: "#64748b" }}>No</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                {order.status === "PENDING" && (
                                                    <button
                                                        onClick={() => handleConfirm(order.id)}
                                                        disabled={confirmingId === order.id}
                                                        style={actionBtn("#2563eb")}
                                                    >
                                                        {confirmingId === order.id ? "..." : "Confirm"}
                                                    </button>
                                                )}
                                                {order.status === "CONFIRMED" && (
                                                    <>
                                                        <button
                                                            onClick={() => openDispatchModal(order)}
                                                            style={actionBtn("#16a34a")}
                                                        >
                                                            Dispatch
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(order.id)}
                                                            style={actionBtn("#b91c1c")}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === "DISPATCHED" && (
                                                    <span style={{ color: "#15803d", fontSize: "13px", fontWeight: 600 }}>✓ Dispatched</span>
                                                )}
                                                {order.status === "CANCELLED" && (
                                                    <span style={{ color: "#b91c1c", fontSize: "13px" }}>Cancelled</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── CREATE ORDER MODAL ─── */}
            {showCreateModal && (
                <div style={overlayStyle}>
                    <div style={{ ...modalStyle, maxWidth: "480px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px" }}>Create Sales Order</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>

                        {createError && (
                            <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "16px" }}>
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateOrder}>
                            <div className="form-group">
                                <label>Accepted Quotation *</label>
                                <select
                                    value={selectedQuotationId}
                                    onChange={(e) => setSelectedQuotationId(e.target.value)}
                                    style={selectStyle}
                                    required
                                >
                                    <option value="">-- Select Accepted Quotation --</option>
                                    {acceptedQuotations.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.quotationNumber} — {q.customer?.companyName} (₹{parseFloat(q.grandTotal).toLocaleString("en-IN")})
                                        </option>
                                    ))}
                                </select>
                                {acceptedQuotations.length === 0 && (
                                    <p style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
                                        No accepted quotations available. Accept a quotation first.
                                    </p>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={createSubmitting || acceptedQuotations.length === 0}
                                    style={{ flex: 1 }}
                                >
                                    {createSubmitting ? "Creating..." : "Create Sales Order"}
                                </button>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: "11px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── DISPATCH MODAL ─── */}
            {dispatchOrder && (
                <div style={overlayStyle}>
                    <div style={{ ...modalStyle, maxWidth: "540px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px" }}>
                                Dispatch — {dispatchOrder.orderNumber}
                            </h2>
                            <button onClick={() => setDispatchOrder(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>

                        {dispatchError && (
                            <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "16px" }}>
                                {dispatchError}
                            </div>
                        )}

                        <form onSubmit={handleDispatch}>
                            <div className="form-group">
                                <label>Vehicle Number *</label>
                                <input
                                    type="text"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    placeholder="e.g. MH12AB1234"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Driver Name *</label>
                                <input
                                    type="text"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    placeholder="Driver full name"
                                    required
                                />
                            </div>

                            {/* Dispatch items (with editable quantities) */}
                            {dispatchItems.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                        Items to Dispatch
                                    </label>
                                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc" }}>
                                                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>Dispatch Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dispatchItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{item.productName}</td>
                                                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.quantity}
                                                                value={item.quantity}
                                                                onChange={(e) => updateDispatchItem(idx, e.target.value)}
                                                                style={{ width: "70px", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "5px", textAlign: "center" }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={dispatchSubmitting}
                                    style={{ flex: 1, background: "#16a34a" }}
                                >
                                    {dispatchSubmitting ? "Dispatching..." : "Confirm Dispatch"}
                                </button>
                                <button type="button" onClick={() => setDispatchOrder(null)} style={{ flex: 1, padding: "11px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#64748b",
    fontSize: "13px",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#1f2937",
    verticalAlign: "middle",
};

const overlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1000,
    padding: "40px 20px",
    overflowY: "auto",
};

const modalStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    width: "100%",
    maxWidth: "580px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
};

const selectStyle = {
    width: "100%",
    height: "42px",
    padding: "0 10px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "14px",
    background: "white",
    color: "#111827",
};

const actionBtn = (bg) => ({
    padding: "6px 12px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
});

export default SalesOrders;