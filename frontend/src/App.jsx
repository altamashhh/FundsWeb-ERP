import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import SalesOrders from "./pages/SalesOrders";
import Inventory from "./pages/Inventory";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/enquiries"
          element={<Enquiries />}
        />

        <Route
          path="/quotations"
          element={<Quotations />}
        />

        <Route
          path="/sales-orders"
          element={<SalesOrders />}
        />

        <Route
          path="/inventory"
          element={<Inventory />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;