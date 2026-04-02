# StockFlow v1
**Advanced Inventory Management System**

StockFlow is a MERN-stack application designed for multi-warehouse inventory tracking, order management, and wholesale operations.

## Features
- **Security**: JWT Authentication & Role-Based Access Control (RBAC).
- **Inventory**: Real-time tracking across multiple Warehouses and Regions.
- **Ledger**: Immutable audit log for every stock movement.
- **Orders**: Full lifecycle management (Draft -> Confirmed -> Dispatched).
- **Wholesale**: One-click Reorder Templates and Duplicate Order functions.
- **Analytics**: Real-time dashboards with visual insights (Recharts).
- **Integration**: WhatsApp sharing for fulfillment.

## Tech Stack
- **Frontend**: React, Vite, React Router v7, Recharts, React-Toastify.
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Database**: MongoDB Atlas.

## Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB URI

### Installation

1.  **Clone Repository**
    ```bash
    git clone https://github.com/Testudo-Group/Stock-Plus.git
    cd stockflow
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Edit .env with your MONGO_URI and JWT_SECRET
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access**: Open `http://localhost:5173`

## Project Structure
- `/backend`: API Server.
- `/frontend`: React SPA.
