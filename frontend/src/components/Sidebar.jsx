import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

import {
    FiHome, FiShoppingCart, FiPackage, FiBarChart2, FiUsers,
    FiMapPin, FiLayers, FiBox, FiTag, FiGrid, FiTrendingUp, FiUserCheck, FiDollarSign, FiLogOut,
    FiMenu, FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
    const { logout } = useAuth();
    const { user, role, PERMISSIONS } = usePermissions();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { to: '/orders', label: 'Orders', icon: <FiShoppingCart />, permission: PERMISSIONS.VIEW_ORDERS },
        {
            label: 'Inventory',
            icon: <FiPackage />,
            permission: PERMISSIONS.MANAGE_INVENTORY,
            subItems: [
                { to: '/inventory/balance', label: 'Stock Levels', icon: <FiLayers /> },
                { to: '/inventory/products', label: 'Products', icon: <FiBox /> },
                { to: '/inventory/brands', label: 'Brands', icon: <FiTag /> },
                { to: '/inventory/categories', label: 'Categories', icon: <FiGrid /> }
            ]
        },
        {
            label: 'Analytics',
            icon: <FiBarChart2 />,
            permission: PERMISSIONS.VIEW_REPORTS,
            subItems: [
                { to: '/analytics', label: 'Reports Dashboard', icon: <FiTrendingUp /> },
                { to: '/analytics/customers', label: 'Customer Insights', icon: <FiUserCheck /> },
                { to: '/analytics/financials', label: 'Financials', icon: <FiDollarSign />, adminOnly: true }
            ]
        },
        { to: '/users', label: 'Users', icon: <FiUsers />, permission: PERMISSIONS.MANAGE_USERS },
        { to: '/settings/locations', label: 'Locations', icon: <FiMapPin />, permission: PERMISSIONS.MANAGE_SETTINGS },
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
                    const hasPermission = !item.permission || role.includes('ADMIN') || user?.permissions?.includes(item.permission);
                    if (!hasPermission) return null;

                    if (item.subItems) {
                        return (
                            <div key={index} className="nav-group">
                                <div className="nav-group-label">
                                    <span className="icon">{item.icon}</span>
                                    <span className="label">{item.label}</span>
                                </div>
                                <div className="nav-group-items">
                                    {item.subItems.map(sub => {
                                        // Check admin-only restriction
                                        if (sub.adminOnly && role !== 'ADMIN') return null;
                                        
                                        return (
                                            <NavLink
                                                key={sub.to}
                                                to={sub.to}
                                                className={({ isActive }) => `sidebar-link sub-link ${isActive ? 'active' : ''}`}
                                                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                                            >
                                                {sub.icon && <span className="icon" style={{ fontSize: '1rem' }}>{sub.icon}</span>}
                                                <span className="label">{sub.label}</span>
                                            </NavLink>
                                        );
                                    })}
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
