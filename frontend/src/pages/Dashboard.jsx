import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEnquiries, getQuotations, getSalesOrders, getInventory } from "../services/api";
import "../App.css";

function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        enquiries: 0,
        quotations: 0,
        salesOrders: 0,
        availableStock: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    })();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const [enqRes, quoRes, soRes, invRes] = await Promise.all([
                getEnquiries(),
                getQuotations(),
                getSalesOrders(),
                getInventory(),
            ]);

            const inventory = invRes.data || [];
            const totalPhysical = inventory.reduce((t, i) => t + Number(i.physicalQuantity || 0), 0);
            const totalReserved = inventory.reduce((t, i) => t + Number(i.reservedQuantity || 0), 0);

            setStats({
                enquiries: (enqRes.data || []).length,
                quotations: (quoRes.data || []).length,
                salesOrders: (soRes.data || []).length,
                availableStock: totalPhysical - totalReserved,
            });
        } catch {
            // Silently ignore stat load failures — backend may not be running yet
        } finally {
            setStatsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const initials = user.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div className="dashboard-page">

            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome to FundsWeb ERP</p>
                </div>

                <div className="dashboard-user">
                    <span className="user-avatar">{initials}</span>
                    <div>
                        <strong>{user.name || "User"}</strong>
                        <small>{user.role || "—"}</small>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            marginLeft: "12px",
                            padding: "8px 14px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "7px",
                            background: "white",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#374151",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Statistics */}
            <section className="dashboard-stats">

                <div className="stat-card">
                    <div className="stat-icon blue">E</div>
                    <div>
                        <span>Total Enquiries</span>
                        <strong>{statsLoading ? "…" : stats.enquiries}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">Q</div>
                    <div>
                        <span>Total Quotations</span>
                        <strong>{statsLoading ? "…" : stats.quotations}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">S</div>
                    <div>
                        <span>Sales Orders</span>
                        <strong>{statsLoading ? "…" : stats.salesOrders}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">I</div>
                    <div>
                        <span>Available Stock</span>
                        <strong>{statsLoading ? "…" : stats.availableStock}</strong>
                    </div>
                </div>

            </section>

            {/* Workflow */}
            <section className="dashboard-section">

                <div className="section-header">
                    <div>
                        <h2>Business Workflow</h2>
                        <p>Manage the complete sales process</p>
                    </div>
                </div>

                <div className="workflow-grid">

                    <Link to="/enquiries" className="workflow-card">
                        <div className="workflow-number">01</div>
                        <h3>Enquiries</h3>
                        <p>Create and manage customer enquiries.</p>
                        <span>Open Enquiries →</span>
                    </Link>

                    <Link to="/quotations" className="workflow-card">
                        <div className="workflow-number">02</div>
                        <h3>Quotations</h3>
                        <p>Create quotations and manage their status.</p>
                        <span>Open Quotations →</span>
                    </Link>

                    <Link to="/sales-orders" className="workflow-card">
                        <div className="workflow-number">03</div>
                        <h3>Sales Orders</h3>
                        <p>Convert accepted quotations into orders.</p>
                        <span>Open Sales Orders →</span>
                    </Link>

                    <Link to="/inventory" className="workflow-card">
                        <div className="workflow-number">04</div>
                        <h3>Inventory</h3>
                        <p>Monitor physical and reserved stock.</p>
                        <span>View Inventory →</span>
                    </Link>

                </div>

            </section>

        </div>
    );
}

export default Dashboard;