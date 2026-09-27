import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    getEnquiries,
    createEnquiry,
    updateEnquiryStatus,
    getCustomers,
    getProducts,
} from "../services/api";
import "../App.css";

const STATUS_COLORS = {
    NEW: { bg: "#eff6ff", color: "#1d4ed8" },
    QUOTED: { bg: "#fefce8", color: "#a16207" },
    WON: { bg: "#dcfce7", color: "#15803d" },
    LOST: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569" };
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

function Enquiries() {
    const navigate = useNavigate();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Form fields
    const [customerId, setCustomerId] = useState("");
    const [requiredDate, setRequiredDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{ productId: "", quantity: 1 }]);

    // Status update
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        try {
            setLoading(true);
            setError("");
            const result = await getEnquiries();
            setEnquiries(result.data || []);
        } catch (err) {
            setError(err.message || "Failed to load enquiries");
        } finally {
            setLoading(false);
        }
    };

    const openModal = async () => {
        setFormError("");
        setCustomerId("");
        setRequiredDate("");
        setNotes("");
        setItems([{ productId: "", quantity: 1 }]);
        setShowModal(true);

        try {
            const [custRes, prodRes] = await Promise.all([
                getCustomers(),
                getProducts(),
            ]);
            setCustomers(custRes.data || []);
            setProducts(prodRes.data || []);
        } catch (err) {
            setFormError("Failed to load customers/products: " + err.message);
        }
    };

    const addItem = () => {
        setItems([...items, { productId: "", quantity: 1 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const updated = items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setItems(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!customerId || !requiredDate) {
            setFormError("Customer and required date are required.");
            return;
        }
        const validItems = items.filter((i) => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            setFormError("At least one product item is required.");
            return;
        }

        try {
            setSubmitting(true);
            await createEnquiry({
                customerId,
                requiredDate,
                notes: notes || undefined,
                items: validItems.map((i) => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                })),
            });
            setShowModal(false);
            fetchEnquiries();
        } catch (err) {
            setFormError(err.message || "Failed to create enquiry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await updateEnquiryStatus(id, newStatus);
            fetchEnquiries();
        } catch (err) {
            alert("Failed to update status: " + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="erp-page">

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>Enquiries</h1>
                    <p>Manage customer enquiries and sales opportunities.</p>
                </div>
                <Link to="/dashboard" className="back-button">← Dashboard</Link>
            </div>

            {/* ACTIONS */}
            <div className="page-actions">
                <button className="primary-button" onClick={openModal}>
                    + New Enquiry
                </button>
            </div>

            {/* TABLE CARD */}
            <div className="table-card">
                <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2>Customer Enquiries</h2>
                        <p>All enquiries created in the system</p>
                    </div>
                    <button className="primary-button" onClick={fetchEnquiries} disabled={loading}>
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </div>

                {/* ERROR */}
                {error && (
                    <div style={{ margin: "20px 24px", padding: "14px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className="empty-table">
                        <div className="empty-table-icon">E</div>
                        <h3>Loading enquiries...</h3>
                        <p>Fetching the latest enquiry records.</p>
                    </div>
                )}

                {/* EMPTY */}
                {!loading && !error && enquiries.length === 0 && (
                    <div className="empty-table">
                        <div className="empty-table-icon">E</div>
                        <h3>No enquiries found</h3>
                        <p>Create your first customer enquiry to start the sales workflow.</p>
                        <button className="primary-button" onClick={openModal}>+ Create Enquiry</button>
                    </div>
                )}

                {/* TABLE */}
                {!loading && !error && enquiries.length > 0 && (
                    <div style={{ overflowX: "auto", padding: "0 24px 24px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                            <thead>
                                <tr>
                                    {["Enquiry #", "Customer", "Required Date", "Items", "Status", "Created By", "Actions"].map((h) => (
                                        <th key={h} style={{ textAlign: "left", padding: "14px 12px", borderBottom: "1px solid #e5e7eb", color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {enquiries.map((enq) => (
                                    <tr key={enq.id}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: "#2563eb" }}>{enq.enquiryNumber}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{enq.customer?.companyName || "-"}</div>
                                            <div style={{ fontSize: 12, color: "#64748b" }}>{enq.customer?.contactPerson}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            {enq.requiredDate ? new Date(enq.requiredDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            {enq.items?.length || 0} item(s)
                                        </td>
                                        <td style={tdStyle}>
                                            <StatusBadge status={enq.status} />
                                        </td>
                                        <td style={tdStyle}>
                                            {enq.createdBy?.name || "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            <select
                                                value={enq.status}
                                                onChange={(e) => handleStatusUpdate(enq.id, e.target.value)}
                                                disabled={updatingId === enq.id}
                                                style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                                            >
                                                <option value="NEW">NEW</option>
                                                <option value="QUOTED">QUOTED</option>
                                                <option value="WON">WON</option>
                                                <option value="LOST">LOST</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── MODAL ─── */}
            {showModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px" }}>Create New Enquiry</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>

                        {formError && (
                            <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "16px" }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Customer *</label>
                                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={selectStyle} required>
                                    <option value="">-- Select Customer --</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.companyName} — {c.contactPerson}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Required Date *</label>
                                <input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "14px", resize: "vertical" }}
                                    placeholder="Optional notes..."
                                />
                            </div>

                            {/* ITEMS */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                    Items *
                                </label>
                                {items.map((item, index) => (
                                    <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                                            style={{ ...selectStyle, flex: 2 }}
                                            required
                                        >
                                            <option value="">-- Select Product --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.productName} ({p.productCode})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                            style={{ flex: 1, height: "42px", padding: "0 10px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "14px" }}
                                            placeholder="Qty"
                                            required
                                        />
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(index)} style={{ padding: "8px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} style={{ padding: "8px 14px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                                    + Add Item
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button type="submit" className="primary-button" disabled={submitting} style={{ flex: 1 }}>
                                    {submitting ? "Creating..." : "Create Enquiry"}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
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

export default Enquiries;