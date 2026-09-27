import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed");
            }

            const token =
                result.token ||
                result.data?.token ||
                result.accessToken;

            if (!token) {
                throw new Error(
                    "Login successful but no authentication token was returned"
                );
            }

            localStorage.setItem("token", token);

            if (result.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(result.user)
                );
            }

            navigate("/dashboard");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-container">

                {/* LEFT SIDE */}
                <div className="login-brand">

                    <div className="brand-icon">
                        FW
                    </div>

                    <h1>FundsWeb ERP</h1>

                    <p>
                        Manage your complete business workflow
                        from enquiry to dispatch.
                    </p>

                    <div className="workflow">
                        <span>Enquiry</span>
                        <span>→</span>
                        <span>Quotation</span>
                        <span>→</span>
                        <span>Order</span>
                        <span>→</span>
                        <span>Dispatch</span>
                    </div>

                </div>

                {/* RIGHT SIDE */}
                <div className="login-form-section">

                    <div className="login-header">
                        <h2>Welcome back</h2>

                        <p>
                            Sign in to your FundsWeb ERP account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label>Email Address</label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                        </button>

                    </form>

                    <p className="login-footer">
                        FundsWeb ERP • Business Management System
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;