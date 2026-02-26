import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { ROLES } from './utils/constants';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Bundles from './pages/Bundles';
import Locations from './pages/Locations';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderCreate from './pages/OrderCreate';
import OrderDetail from './pages/OrderDetail';

import Analytics from './pages/Analytics';
import CustomerAnalytics from './pages/CustomerAnalytics';
import Financials from './pages/Financials';
import Users from './pages/Users';
import VerifyEmail from './pages/VerifyEmail';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';

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
                <Layout>
                  <Routes>
                    {/* Dashboard - All roles */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Analytics - All except VIEWER (only Dashboard + Operational Insights) */}
                    <Route 
                      path="/analytics" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES, ROLES.VIEWER]}>
                          <Analytics />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/analytics/customers" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]}>
                          <CustomerAnalytics />
                        </RoleRoute>
                      } 
                    />
                    
                    {/* Financials - Admin only */}
                    <Route 
                      path="/analytics/financials" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                          <Financials />
                        </RoleRoute>
                      } 
                    />
                    
                    {/* Orders - All except VIEWER */}
                    <Route 
                      path="/orders" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]}>
                          <Orders />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/orders/new" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]}>
                          <OrderCreate />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/orders/:id" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]}>
                          <OrderDetail />
                        </RoleRoute>
                      } 
                    />
                    
                    {/* Inventory - Admin and Inventory Manager only */}
                    <Route 
                      path="/inventory/brands" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Brands />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/inventory/categories" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Categories />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/inventory/products" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Products />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/inventory/bundles" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Bundles />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/inventory/balance" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Inventory />
                        </RoleRoute>
                      } 
                    />
                    
                    {/* Settings - Admin and Inventory Manager */}
                    <Route 
                      path="/settings/locations" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <Locations />
                        </RoleRoute>
                      } 
                    />
                    
                    {/* Users - Admin only */}
                    <Route 
                      path="/users" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                          <Users />
                        </RoleRoute>
                      } 
                    />
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <InstallPrompt />
    </AuthProvider >
  );
}

export default App;
