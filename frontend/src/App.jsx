import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import Products from './pages/Products';
import Locations from './pages/Locations';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderCreate from './pages/OrderCreate';
import OrderDetail from './pages/OrderDetail';

import Analytics from './pages/Analytics';
import CustomerAnalytics from './pages/CustomerAnalytics';
import Users from './pages/Users';
import VerifyEmail from './pages/VerifyEmail';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/analytics/customers" element={<CustomerAnalytics />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/new" element={<OrderCreate />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/inventory/brands" element={<Brands />} />
                    <Route path="/inventory/products" element={<Products />} />
                    <Route path="/inventory/balance" element={<Inventory />} />
                    <Route path="/settings/locations" element={<Locations />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                  {/* <Footer /> */}
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider >
  );
}

export default App;
