import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/inventory",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to fetch inventory"
                );
            }

            /*
             * Backend response:
             * {
             *   success: true,
             *   data: [...]
             * }
             */
            setInventory(result.data || []);

        } catch (err) {
            console.error("Inventory fetch error:", err);
            setError(err.message || "Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    /*
     * Calculate totals
     */
    const totalPhysical = inventory.reduce(
        (total, item) =>
            total + Number(item.physicalQuantity || 0),
        0
    );

    const totalReserved = inventory.reduce(
        (total, item) =>
            total + Number(item.reservedQuantity || 0),
        0
    );

    const totalAvailable = totalPhysical - totalReserved;

    /*
     * Determine stock status
     */
    const getStockStatus = (available) => {
        if (available <= 0) {
            return {
                text: "Out of Stock",
                className: "stock-danger",
            };
        }

        if (available <= 10) {
            return {
                text: "Low Stock",
                className: "stock-warning",
            };
        }

        return {
            text: "Available",
            className: "stock-success",
        };
    };

    return (
        <div className="erp-page">

            {/* ================================
                PAGE HEADER
            ================================= */}

            <div className="page-header">

                <div>
                    <h1>Inventory</h1>

                    <p>
                        Monitor physical, reserved and available stock.
                    </p>
                </div>

                <Link
                    to="/dashboard"
                    className="back-button"
                >
                    ← Dashboard
                </Link>

            </div>


            {/* ================================
                INVENTORY SUMMARY
            ================================= */}

            <div className="inventory-summary">

                <div className="inventory-card">

                    <span>Total Physical Stock</span>

                    <strong>
                        {loading ? "..." : totalPhysical}
                    </strong>

                </div>


                <div className="inventory-card">

                    <span>Total Reserved Stock</span>

                    <strong>
                        {loading ? "..." : totalReserved}
                    </strong>

                </div>


                <div className="inventory-card available">

                    <span>Total Available Stock</span>

                    <strong>
                        {loading ? "..." : totalAvailable}
                    </strong>

                </div>

            </div>


            {/* ================================
                INVENTORY TABLE
            ================================= */}

            <div className="table-card">

                <div className="table-header">

                    <div>
                        <h2>Inventory</h2>

                        <p>
                            Current inventory availability by product
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={fetchInventory}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>

                </div>


                {/* ================================
                    ERROR
                ================================= */}

                {error && (
                    <div
                        style={{
                            margin: "20px 24px",
                            padding: "14px 16px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            color: "#b91c1c",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}


                {/* ================================
                    LOADING
                ================================= */}

                {loading && (
                    <div className="empty-table">

                        <div className="empty-table-icon">
                            I
                        </div>

                        <h3>Loading inventory...</h3>

                        <p>
                            Fetching the latest inventory records.
                        </p>

                    </div>
                )}


                {/* ================================
                    EMPTY STATE
                ================================= */}

                {!loading &&
                    !error &&
                    inventory.length === 0 && (
                        <div className="empty-table">

                            <div className="empty-table-icon">
                                I
                            </div>

                            <h3>
                                No inventory records found
                            </h3>

                            <p>
                                Inventory records will appear here
                                when products are added to the system.
                            </p>

                        </div>
                    )}


                {/* ================================
                    INVENTORY TABLE
                ================================= */}

                {!loading &&
                    !error &&
                    inventory.length > 0 && (

                        <div
                            style={{
                                overflowX: "auto",
                                padding: "0 24px 24px",
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    marginTop: "10px",
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Product
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Product Code
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "right",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Physical
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "right",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Reserved
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "right",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Available
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "center",
                                                padding: "14px 12px",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {inventory.map((item) => {

                                        const physical =
                                            Number(
                                                item.physicalQuantity || 0
                                            );

                                        const reserved =
                                            Number(
                                                item.reservedQuantity || 0
                                            );

                                        const available =
                                            physical - reserved;

                                        const stockStatus =
                                            getStockStatus(
                                                available
                                            );

                                        /*
                                         * Product may be returned
                                         * as a nested object.
                                         */
                                        const productName =
                                            item.product?.name ||
                                            item.product?.productName ||
                                            "Unknown Product";

                                        const productCode =
                                            item.product?.code ||
                                            item.product?.productCode ||
                                            "-";

                                        return (
                                            <tr key={item.id}>

                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        fontWeight: "600",
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {productName}
                                                </td>


                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color: "#64748b",
                                                    }}
                                                >
                                                    {productCode}
                                                </td>


                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        textAlign: "right",
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {physical}
                                                </td>


                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        textAlign: "right",
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {reserved}
                                                </td>


                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        textAlign: "right",
                                                        fontWeight: "700",
                                                        color:
                                                            available > 0
                                                                ? "#16a34a"
                                                                : "#dc2626",
                                                    }}
                                                >
                                                    {available}
                                                </td>


                                                <td
                                                    style={{
                                                        padding:
                                                            "16px 12px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        textAlign: "center",
                                                    }}
                                                >

                                                    <span
                                                        className={
                                                            stockStatus.className
                                                        }
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding:
                                                                "5px 10px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        {
                                                            stockStatus.text
                                                        }
                                                    </span>

                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>
                    )}

            </div>

        </div>
    );
}

export default Inventory;