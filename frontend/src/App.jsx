import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CountryProvider } from './context/CountryContext';
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
import OrderEdit from './pages/OrderEdit';

import SORDashboard from './pages/sor/SORDashboard';
import SORCustomers from './pages/sor/SORCustomers';
import SORCustomerDetail from './pages/sor/SORCustomerDetail';
import SOROrderCreate from './pages/sor/SOROrderCreate';

import InventoryHistory from './pages/InventoryHistory';
import Analytics from './pages/Analytics';
import CustomerAnalytics from './pages/CustomerAnalytics';
import Financials from './pages/Financials';
import Users from './pages/Users';
import VerifyEmail from './pages/VerifyEmail';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import CountrySettings from './pages/CountrySettings';

function App() {
  return (
    <AuthProvider>
      <CountryProvider>
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
                    <Route 
                      path="/orders/:id/edit" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]}>
                          <OrderEdit />
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
                      path="/inventory/history"
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
                          <InventoryHistory />
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
                    <Route
                      path="/settings/countries"
                      element={
                        <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                          <CountrySettings />
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
                    
                    {/* SOR - Sales, Inventory Manager, Admin */}
                    <Route 
                      path="/sor/dashboard" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.SALES, ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
                          <SORDashboard />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/sor/customers" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.SALES, ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
                          <SORCustomers />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/sor/customers/:id" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.SALES, ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
                          <SORCustomerDetail />
                        </RoleRoute>
                      } 
                    />
                    <Route 
                      path="/sor/orders/new" 
                      element={
                        <RoleRoute allowedRoles={[ROLES.SALES, ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
                          <SOROrderCreate />
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
      </CountryProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <InstallPrompt />
    </AuthProvider >
  );
}

export default App;
