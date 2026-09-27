import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    getQuotations,
    createQuotation,
    updateQuotationStatus,
    getEnquiries,
    getProducts,
} from "../services/api";
import "../App.css";

const STATUS_COLORS = {
    DRAFT: { bg: "#f1f5f9", color: "#475569" },
    SENT: { bg: "#fefce8", color: "#a16207" },
    ACCEPTED: { bg: "#dcfce7", color: "#15803d" },
    REJECTED: { bg: "#fee2e2", color: "#b91c1c" },
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

function Quotations() {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [enquiries, setEnquiries] = useState([]);
    const [products, setProducts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Form fields
    const [selectedEnquiryId, setSelectedEnquiryId] = useState("");
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [validUntil, setValidUntil] = useState("");
    const [items, setItems] = useState([]);

    // Status update
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            setError("");
            const result = await getQuotations();
            setQuotations(result.data || []);
        } catch (err) {
            setError(err.message || "Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    const openModal = async () => {
        setFormError("");
        setSelectedEnquiryId("");
        setSelectedEnquiry(null);
        setValidUntil("");
        setItems([]);
        setShowModal(true);

        try {
            const [enqRes, prodRes] = await Promise.all([
                getEnquiries(),
                getProducts(),
            ]);
            // Only show enquiries that have items (can be quoted)
            setEnquiries(enqRes.data || []);
            setProducts(prodRes.data || []);
        } catch (err) {
            setFormError("Failed to load enquiries/products: " + err.message);
        }
    };

    const handleEnquirySelect = (enquiryId) => {
        setSelectedEnquiryId(enquiryId);
        const enq = enquiries.find((e) => e.id === enquiryId);
        setSelectedEnquiry(enq || null);

        if (enq && enq.items) {
            // Pre-populate items from enquiry
            setItems(
                enq.items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    discountPct: 0,
                    gstPct: 18,
                }))
            );
        } else {
            setItems([]);
        }
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

        if (!selectedEnquiryId || !validUntil) {
            setFormError("Enquiry and valid until date are required.");
            return;
        }
        if (items.length === 0) {
            setFormError("At least one item is required.");
            return;
        }

        try {
            setSubmitting(true);
            await createQuotation({
                enquiryId: selectedEnquiryId,
                validUntil,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                    discountPct: Number(i.discountPct || 0),
                    gstPct: Number(i.gstPct || 0),
                })),
            });
            setShowModal(false);
            fetchQuotations();
        } catch (err) {
            setFormError(err.message || "Failed to create quotation");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await updateQuotationStatus(id, newStatus);
            fetchQuotations();
        } catch (err) {
            alert("Failed to update status: " + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const formatCurrency = (val) => {
        const num = parseFloat(val);
        return isNaN(num)
            ? "₹0.00"
            : "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    };

    return (
        <div className="erp-page">

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>Quotations</h1>
                    <p>Manage customer quotations and their status.</p>
                </div>
                <Link to="/dashboard" className="back-button">← Dashboard</Link>
            </div>

            {/* ACTIONS */}
            <div className="page-actions">
                <button className="primary-button" onClick={openModal}>
                    + New Quotation
                </button>
            </div>

            {/* TABLE CARD */}
            <div className="table-card">
                <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2>Customer Quotations</h2>
                        <p>All quotations created in the system</p>
                    </div>
                    <button className="primary-button" onClick={fetchQuotations} disabled={loading}>
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
                        <div className="empty-table-icon">Q</div>
                        <h3>Loading quotations...</h3>
                        <p>Fetching the latest quotation records.</p>
                    </div>
                )}

                {!loading && !error && quotations.length === 0 && (
                    <div className="empty-table">
                        <div className="empty-table-icon">Q</div>
                        <h3>No quotations found</h3>
                        <p>Create a quotation from an existing enquiry.</p>
                        <button className="primary-button" onClick={openModal}>+ Create Quotation</button>
                    </div>
                )}

                {!loading && !error && quotations.length > 0 && (
                    <div style={{ overflowX: "auto", padding: "0 24px 24px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                            <thead>
                                <tr>
                                    {["Quotation #", "Enquiry #", "Customer", "Valid Until", "Grand Total", "Status", "Update Status"].map((h) => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {quotations.map((q) => (
                                    <tr key={q.id}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: "#2563eb" }}>{q.quotationNumber}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            {q.enquiry?.enquiryNumber || "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{q.customer?.companyName || "-"}</div>
                                            <div style={{ fontSize: 12, color: "#64748b" }}>{q.customer?.contactPerson}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "-"}
                                        </td>
                                        <td style={tdStyle}>
                                            <strong>{formatCurrency(q.grandTotal)}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            <StatusBadge status={q.status} />
                                        </td>
                                        <td style={tdStyle}>
                                            {/* Only allow status updates if not already accepted/rejected */}
                                            <select
                                                value={q.status}
                                                onChange={(e) => handleStatusUpdate(q.id, e.target.value)}
                                                disabled={updatingId === q.id}
                                                style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                                            >
                                                <option value="DRAFT">DRAFT</option>
                                                <option value="SENT">SENT</option>
                                                <option value="ACCEPTED">ACCEPTED</option>
                                                <option value="REJECTED">REJECTED</option>
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
                            <h2 style={{ margin: 0, fontSize: "20px" }}>Create New Quotation</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>

                        {formError && (
                            <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", marginBottom: "16px" }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Select Enquiry *</label>
                                <select
                                    value={selectedEnquiryId}
                                    onChange={(e) => handleEnquirySelect(e.target.value)}
                                    style={selectStyle}
                                    required
                                >
                                    <option value="">-- Select Enquiry --</option>
                                    {enquiries.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.enquiryNumber} — {e.customer?.companyName} ({e.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEnquiry && (
                                <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#1e40af" }}>
                                    <strong>Customer:</strong> {selectedEnquiry.customer?.companyName} &nbsp;|&nbsp;
                                    <strong>Items:</strong> {selectedEnquiry.items?.length || 0}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Valid Until *</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    required
                                />
                            </div>

                            {/* ITEMS from the selected enquiry */}
                            {items.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                        Quotation Items
                                    </label>
                                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc" }}>
                                                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>Qty</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>Discount%</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>GST%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => {
                                                    const prod = products.find((p) => p.id === item.productId);
                                                    return (
                                                        <tr key={idx}>
                                                            <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                                                {prod ? `${prod.productName} (${prod.productCode})` : item.productId}
                                                            </td>
                                                            <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                                                    style={{ width: "60px", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "5px", textAlign: "center" }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={item.discountPct}
                                                                    onChange={(e) => updateItem(idx, "discountPct", e.target.value)}
                                                                    style={{ width: "60px", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "5px", textAlign: "center" }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={item.gstPct}
                                                                    onChange={(e) => updateItem(idx, "gstPct", e.target.value)}
                                                                    style={{ width: "60px", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "5px", textAlign: "center" }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {items.length === 0 && selectedEnquiryId && (
                                <div style={{ padding: "12px", background: "#fef2f2", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#b91c1c" }}>
                                    The selected enquiry has no items.
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button type="submit" className="primary-button" disabled={submitting || items.length === 0} style={{ flex: 1 }}>
                                    {submitting ? "Creating..." : "Create Quotation"}
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
    maxWidth: "640px",
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

export default Quotations;