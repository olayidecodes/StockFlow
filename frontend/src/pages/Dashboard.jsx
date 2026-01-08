import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <div className="logo-icon">📦</div>
                    <h2>StockFlow</h2>
                </div>
                <div className="nav-actions">
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-section">
                    <h1>Welcome to StockFlow</h1>
                    <p className="subtitle">Multi-region, multi-warehouse inventory management</p>
                </div>

                <div className="user-info-card">
                    <h3>Your Profile</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{user?.email}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Role</span>
                            <span className="info-value">
                                <span className="badge">{user?.role}</span>
                            </span>
                        </div>
                        {user?.region && (
                            <div className="info-item">
                                <span className="info-label">Region</span>
                                <span className="info-value">{user.region}</span>
                            </div>
                        )}
                        {user?.warehouse && (
                            <div className="info-item">
                                <span className="info-label">Warehouse</span>
                                <span className="info-value">{user.warehouse}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Inventory Tracking</h3>
                        <p>Track inventory in pieces internally while allowing users to work in cartons + pieces</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🏢</div>
                        <h3>Multi-Warehouse</h3>
                        <p>Manage inventory across multiple regions and warehouses seamlessly</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📝</div>
                        <h3>Immutable Ledger</h3>
                        <p>All stock movements are logged in an immutable ledger for full traceability</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Role-Based Access</h3>
                        <p>Enterprise-grade role-based access control enforced everywhere</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
