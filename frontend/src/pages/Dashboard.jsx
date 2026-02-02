import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from '../components/PermissionGuard';

const Dashboard = () => {
    const { logout } = useAuth();
    const { user, role, ROLES, PERMISSIONS, can } = usePermissions();
    const navigate = useNavigate();

    console.log(user);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case ROLES.ADMIN: return 'linear-gradient(135deg, #FF6B6B, #EE5D5D)';
            case ROLES.INVENTORY_MANAGER: return 'linear-gradient(135deg, #4DADF7, #3B99E6)';
            case ROLES.SALES: return 'linear-gradient(135deg, #51CF66, #40C057)';
            case ROLES.VIEWER: return 'linear-gradient(135deg, #FCC419, #FAB005)';
            default: return 'var(--color-primary)';
        }
    };


    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="welcome-section">
                    <h1>Welcome, {user?.username}</h1>
                    <p className="subtitle">
                        You are logged in as <span className="badge" style={{ background: getRoleBadgeColor(role) }}>{role?.replace('_', ' ')}</span>
                    </p>
                </div>

                <div className="dashboard-grid">
                    {/* User Profile Card */}
                    <div className="dashboard-card user-card">
                        <h3>Your Profile</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Email</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Region</span>
                                <span className="info-value">{user?.region || 'Not assigned'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Warehouse</span>
                                <span className="info-value">{user?.warehouse || 'Not assigned'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Capabilities Card */}
                    <div className="dashboard-card capabilities-card">
                        <h3>Your Capabilities</h3>
                        <div className="capabilities-list">
                            <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
                                <div className="capability-item active">
                                    <span className="icon">👥</span>
                                    <span>Manage Users</span>
                                </div>
                            </PermissionGuard>

                            <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                <div className="capability-item active">
                                    <span className="icon">📦</span>
                                    <span>Manage Inventory</span>
                                </div>
                            </PermissionGuard>

                            <PermissionGuard permission={PERMISSIONS.CREATE_ORDERS}>
                                <div className="capability-item active">
                                    <span className="icon">📝</span>
                                    <span>Create Orders</span>
                                </div>
                            </PermissionGuard>

                            <PermissionGuard permission={PERMISSIONS.VIEW_REPORTS}>
                                <div className="capability-item active">
                                    <span className="icon">📊</span>
                                    <span>View Reports</span>
                                </div>
                            </PermissionGuard>

                            <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                                <div className="capability-item active">
                                    <span className="icon">⚙️</span>
                                    <span>System Settings</span>
                                </div>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>

                {/* Action Areas based on Permissions */}
                <div className="action-areas">
                    <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
                        <div className="action-card admin-area">
                            <h3>⚠️ Admin Zone</h3>
                            <p>User management and system configuration area.</p>
                            <div className="button-group">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/users')}
                                >Manage Users</button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/settings/locations')}
                                >
                                    Locations
                                </button>
                            </div>
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                        <div className="action-card inventory-area">
                            <h3>📦 Inventory Control</h3>
                            <p>Adjust stock levels, move inventory, and manage cartons.</p>
                            <div className="button-group">
                                <button className="btn btn-primary" onClick={() => navigate('/inventory/balance')}>
                                    Stock Levels
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/inventory/products')}
                                >
                                    Products
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/inventory/brands')}
                                >
                                    Brands
                                </button>
                            </div>
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.VIEW_ORDERS}>
                        <div className="action-card orders-area">
                            <h3>🛒 Order Management</h3>
                            <p>Process orders, manage fulfillment, and track shipments.</p>
                            <div className="button-group">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/orders/new')}
                                >
                                    New Order
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/orders')}
                                >
                                    All Orders
                                </button>
                            </div>
                        </div>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSIONS.VIEW_REPORTS}>
                        <div className="action-card analytics-area">
                            <h3>📊 Analytics</h3>
                            <p>View sales trends, regional performance, and stock health.</p>
                            <div className="button-group">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/analytics')}
                            >
                                View Reports
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/analytics/customers')}
                            >
                                Customers
                            </button>
                            </div>
                        </div>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
