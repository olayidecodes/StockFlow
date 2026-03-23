import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ROLES } from '../utils/constants';

import {
    FiHome, FiShoppingCart, FiPackage, FiBarChart2, FiUsers,
    FiMapPin, FiLayers, FiBox, FiTag, FiGrid, FiTrendingUp, FiUserCheck, FiDollarSign, FiLogOut,
    FiMenu, FiChevronLeft, FiChevronRight, FiX, FiRepeat
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
    const { logout } = useAuth();
    const { user, role, PERMISSIONS } = usePermissions();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper function to check if user can access a route
    const canAccess = (allowedRoles) => {
        return allowedRoles.includes(role);
    };

    const navItems = [
        { 
            to: '/dashboard', 
            label: 'Dashboard', 
            icon: <FiHome />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES, ROLES.VIEWER]
        },
        { 
            to: '/orders', 
            label: 'Orders', 
            icon: <FiShoppingCart />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]
        },
        {
            label: 'Inventory',
            icon: <FiPackage />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER],
            subItems: [
                { to: '/inventory/balance', label: 'Stock Levels', icon: <FiLayers /> },
                { to: '/inventory/products', label: 'Products', icon: <FiBox /> },
                { to: '/inventory/bundles', label: 'Bundles', icon: <FiPackage /> },
                { to: '/inventory/brands', label: 'Brands', icon: <FiTag /> },
                { to: '/inventory/categories', label: 'Categories', icon: <FiGrid /> }
            ]
        },
        {
            label: 'Analytics',
            icon: <FiBarChart2 />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES, ROLES.VIEWER],
            subItems: [
                { 
                    to: '/analytics', 
                    label: 'Operational Insights', 
                    icon: <FiTrendingUp />,
                    allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES, ROLES.VIEWER]
                },
                { 
                    to: '/analytics/customers', 
                    label: 'Customer Insights', 
                    icon: <FiUserCheck />,
                    allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES]
                },
                { 
                    to: '/analytics/financials', 
                    label: 'Financials', 
                    icon: <FiDollarSign />,
                    allowedRoles: [ROLES.ADMIN]
                }
            ]
        },
        {
            label: 'Sales on Return',
            icon: <FiRepeat />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.SALES],
            subItems: [
                { to: '/sor/dashboard', label: 'SOR Dashboard', icon: <FiRepeat /> },
                { to: '/sor/customers', label: 'SOR Customers', icon: <FiUsers /> },
                { to: '/sor/orders/new', label: 'New SOR Order', icon: <FiShoppingCart /> }
            ]
        },
        { 
            to: '/users', 
            label: 'Users', 
            icon: <FiUsers />,
            allowedRoles: [ROLES.ADMIN]
        },
        { 
            to: '/settings/locations', 
            label: 'Locations', 
            icon: <FiMapPin />,
            allowedRoles: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER]
        },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="logo">
                        <span className="logo-text">STOCKFLOW</span>
                    </div>
                )}
                <div className="header-actions-sidebar" style={{ display: 'flex', gap: '4px' }}>
                    <button className="collapse-toggle desktop-only-btn" onClick={toggleCollapse} title={isCollapsed ? "Expand" : "Collapse"}>
                        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    </button>
                    <button className="close-sidebar-btn" onClick={toggleSidebar}><FiX /></button>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item, index) => {
                    // Check if user has access to this item
                    if (!canAccess(item.allowedRoles)) return null;

                    if (item.subItems) {
                        // Filter sub-items based on role
                        const visibleSubItems = item.subItems.filter(sub => 
                            !sub.allowedRoles || canAccess(sub.allowedRoles)
                        );

                        // Don't show group if no sub-items are visible
                        if (visibleSubItems.length === 0) return null;

                        return (
                            <div key={index} className="nav-group">
                                <div className="nav-group-label">
                                    <span className="icon">{item.icon}</span>
                                    <span className="label">{item.label}</span>
                                </div>
                                <div className="nav-group-items">
                                    {visibleSubItems.map(sub => (
                                        <NavLink
                                            key={sub.to}
                                            to={sub.to}
                                            className={({ isActive }) => `sidebar-link sub-link ${isActive ? 'active' : ''}`}
                                            onClick={() => window.innerWidth < 768 && toggleSidebar()}
                                        >
                                            {sub.icon && <span className="icon" style={{ fontSize: '1rem' }}>{sub.icon}</span>}
                                            <span className="label">{sub.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <span className="name">{user?.username}</span>
                        {/* <span className="role">{role?.replace('_', ' ')}</span> */}
                    </div>
                    {!isCollapsed && (
                        <button onClick={handleLogout} className="logout-btn" title="Logout">
                            <FiLogOut />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
