import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';

const Navbar = () => {
    const { logout } = useAuth();
    const { user, role, PERMISSIONS } = usePermissions();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Prevent body scroll when menu is open on mobile
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [isMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="main-navbar">
            <div className="nav-container">
                <div className="nav-brand" onClick={() => { navigate('/dashboard'); closeMenu(); }}>
                    <div className="logo-icon">📦</div>
                    <span className="brand-name">StockFlow</span>
                </div>

                <button
                    className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle navigation"
                >
                    <span className="hamburger"></span>
                </button>

                <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                    <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        Dashboard
                    </NavLink>

                    <PermissionGuard permission={PERMISSIONS.VIEW_ORDERS}>
                        <NavLink to="/orders" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            Orders
                        </NavLink>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                        <div className="nav-dropdown">
                            <span className="nav-item">Inventory</span>
                            <div className="dropdown-content">
                                <NavLink to="/inventory/balance" onClick={closeMenu}>Stock Levels</NavLink>
                                <NavLink to="/inventory/products" onClick={closeMenu}>Products</NavLink>
                                <NavLink to="/inventory/brands" onClick={closeMenu}>Brands</NavLink>
                            </div>
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.VIEW_REPORTS}>
                        <div className="nav-dropdown">
                            <span className="nav-item">Analytics</span>
                            <div className="dropdown-content">
                                <NavLink to="/analytics" onClick={closeMenu}>Dashboard</NavLink>
                                <NavLink to="/analytics/customers" onClick={closeMenu}>Customers</NavLink>
                            </div>
                        </div>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
                        <NavLink to="/users" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            Users
                        </NavLink>
                    </PermissionGuard>

                    <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                        <NavLink to="/settings/locations" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            Locations
                        </NavLink>
                    </PermissionGuard>

                    <div className="nav-user-mobile">
                        <div className="user-profile">
                            <span className="user-name">{user?.username}</span>
                            <span className="user-role">{role?.replace('_', ' ')}</span>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="nav-user">
                    <div className="user-profile">
                        <span className="user-name">{user?.username}</span>
                        <span className="user-role">{role?.replace('_', ' ')}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="nav-backdrop" onClick={closeMenu}></div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
