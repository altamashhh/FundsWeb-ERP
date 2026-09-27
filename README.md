# FundsWeb ERP

A full-stack ERP application for managing the complete business workflow from customer enquiry to quotation, sales order, inventory reservation, and dispatch.

The project was developed as a full-stack technical case study using React, Node.js, Express.js, Prisma ORM, and PostgreSQL.

---

## 1. Project Overview

FundsWeb ERP manages a simplified sales and fulfilment workflow:

```text
Customer Enquiry
       ↓
Quotation
       ↓
Accepted Quotation
       ↓
Sales Order
       ↓
Inventory Confirmation & Reservation
       ↓
Dispatch

2. Key Features
Authentication
JWT-based authentication
Secure password verification using bcrypt
Protected backend APIs
Bearer-token authentication from the React frontend
Role-based authorization for restricted operations
Enquiries
View customer enquiries
Create enquiries
Associate enquiries with customers and products
Track enquiry status
Quotations
Create quotations from enquiries
Calculate quotation totals
Apply discount and GST values
Track quotation status
Only accepted quotations can be converted into sales orders
Sales Orders
Create sales orders from accepted quotations
Prevent duplicate sales orders for the same quotation
Track order status
Confirm sales orders
Cancel sales orders
Dispatch confirmed sales orders
Inventory
Track physical stock
Track reserved stock
Calculate available stock
Prevent reservation beyond available inventory
Transaction-safe inventory reservation
Inventory updates during dispatch
Dispatch
Create dispatch records for sales orders
Capture vehicle and driver details
Record dispatched quantities
Update sales order status to DISPATCHED
3. Business Workflow

The application follows this workflow:

Step 1 — Enquiry

A sales user creates a customer enquiry containing:

Customer
Required date
Notes
Product
Quantity
Step 2 — Quotation

A quotation is generated from an enquiry.

Quotation totals are calculated using the quotation item values, discounts, and GST.

Step 3 — Quotation Acceptance

A quotation must be in ACCEPTED status before it can be converted into a sales order.

DRAFT and REJECTED quotations cannot create sales orders.

Step 4 — Sales Order

An accepted quotation can be converted into a sales order.

The system prevents the same quotation from generating duplicate sales orders.

Step 5 — Sales Order Confirmation

When a sales order is confirmed, the backend checks available inventory.

Available Stock = Physical Stock - Reserved Stock

If sufficient inventory exists:

Sales Order → CONFIRMED
Inventory → Reserved

If inventory is insufficient, the confirmation is rejected and the transaction is rolled back.

Step 6 — Dispatch

A confirmed sales order can be dispatched by providing:

Vehicle number
Driver name
Product
Dispatch quantity

After successful dispatch, the sales order becomes:

DISPATCHED

The corresponding physical and reserved inventory quantities are updated.

4. Technology Stack
Frontend
React.js
Vite
JavaScript
React Router
Fetch API
CSS
Backend
Node.js
Express.js
Prisma ORM
PostgreSQL
JWT
bcryptjs
Zod
Vitest
5. Project Structure
FundsWeb-ERP/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── tests/
│   │   └── salesOrder.test.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Enquiries.jsx
│   │   │   ├── Quotations.jsx
│   │   │   ├── SalesOrders.jsx
│   │   │   └── Inventory.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   └── package.json
│
├── .gitignore
└── README.md
6. Backend API

The backend runs by default on:

http://localhost:5000
Authentication
POST /api/auth/login
Inventory
GET /api/inventory
GET /api/inventory/:productId
POST /api/inventory
POST /api/inventory/reserve/:salesOrderId
Quotations
PUT /api/quotations/:id/status
Sales Orders
PUT /api/sales-orders/:id/status
Dispatch
POST /api/dispatches

Additional enquiry, quotation, customer, product, and sales-order endpoints are implemented in the backend route modules.

Protected APIs require:

Authorization: Bearer <JWT_TOKEN>
7. Authentication

After successful login, the frontend stores the JWT token in browser local storage.

The token is then sent with protected API requests:

Authorization: Bearer <token>

The backend validates the JWT before allowing access to protected operations.

8. Inventory Reservation Logic

Inventory availability is calculated as:

Available = Physical Quantity - Reserved Quantity

For example:

Physical Stock  = 75
Reserved Stock  = 25
Available Stock = 50

If a sales order requires more than the available quantity, confirmation is rejected.

Example:

Available = 50
Required  = 60

Result:
Confirmation rejected
Sales Order remains PENDING
Inventory remains unchanged

Inventory reservation is performed transactionally during sales order confirmation to prevent inconsistent stock updates.

9. Business Rules

The application enforces the following rules:

Rule 1 — Quotation Total

Quotation totals are calculated from quotation item values, discounts, and GST.

Rule 2 — Accepted Quotations Only

Only quotations with:

ACCEPTED

status can be converted into sales orders.

Rule 3 — No Duplicate Sales Orders

A quotation cannot generate multiple sales orders.

Rule 4 — Inventory Availability

A sales order cannot be confirmed if the required quantity exceeds available inventory.

Rule 5 — Authorization

Restricted operations require an authenticated and authorized user.

10. Automated Tests

The backend uses Vitest.

Run:

cd backend
npm test

Current test suite:

✓ should calculate quotation total correctly
✓ should reject sales order conversion from non-accepted quotation
✓ should prevent duplicate sales order for the same quotation
✓ should reject an order when inventory is insufficient
✓ should reject unauthorized sales order confirmation

Current result:

5 tests passed
11. Frontend

The frontend runs using Vite.

Default development URL:

http://localhost:5173

Main screens:

Login
Dashboard
Enquiries
Quotations
Sales Orders
Inventory

The frontend communicates with the Express backend through REST APIs.

12. Environment Variables

Create a .env file inside the backend directory.

Example:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/fundsweb_erp"
JWT_SECRET="your_jwt_secret"
PORT=5000

Do not commit the real .env file to GitHub.

13. Installation
Clone the Repository
git clone https://github.com/altamashhh/FundsWeb-ERP.git
cd FundsWeb-ERP
Backend
cd backend
npm install

Configure the PostgreSQL database and .env file.

Generate the Prisma client:

npx prisma generate

Start the backend:

npm run dev

Backend:

http://localhost:5000
Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
14. Production Build

To create a production build of the frontend:

cd frontend
npm run build

The project has been verified with a successful Vite production build.

15. End-to-End Verification

The following workflow was manually verified:

Login
  ↓
Dashboard
  ↓
Enquiries
  ↓
Quotations
  ↓
Accepted Quotation
  ↓
Sales Order
  ↓
Confirm Sales Order
  ↓
Inventory Reservation
  ↓
Dispatch
  ↓
DISPATCHED
Insufficient Inventory Test

The insufficient inventory scenario was manually verified.

Example:

Available Stock  = 50
Required Quantity = 60

Result:

Confirmation: REJECTED
Sales Order:   PENDING
Inventory:     UNCHANGED
Successful Workflow Test

A successful sales order confirmation was also verified:

PENDING
   ↓
CONFIRMED
   ↓
Inventory Reserved

A confirmed sales order was then successfully dispatched:

CONFIRMED
   ↓
DISPATCHED

Inventory values were updated correctly after dispatch.

16. Validation Results
Backend Tests
5 / 5 tests passed
Frontend Build
Vite production build successful
Manual UI Verification
Login               ✓
Dashboard           ✓
Enquiries           ✓
Quotations          ✓
Sales Orders        ✓
Inventory           ✓
Inventory failure   ✓
Order confirmation  ✓
Dispatch            ✓
17. Future Enhancements

Possible future improvements include:

More detailed role-based frontend navigation
Advanced search and filtering
Pagination
Improved dashboard analytics
Audit logs
Notification system
More comprehensive integration tests
Concurrent reservation handling improvements
Cloud deployment using a managed PostgreSQL database and hosting platform
18. Author

Altamash Sheikh

MCA — MET Institute of Management, Mumbai

GitHub:

https://github.com/altamashhh/FundsWeb-ERP

19. License

This project was developed as a full-stack technical case study and demonstration project.
