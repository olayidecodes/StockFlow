import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useCountry } from '../context/CountryContext';
import CountrySelector from './CountrySelector';
import Spinner from './Spinner';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { loadingCountries } = useCountry();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
            />

            <main className="main-content">
                {/* Top Header */}
                <header className="top-header">
                    {/* Mobile hamburger */}
                    <button className="menu-btn mobile-only" onClick={toggleSidebar} aria-label="Open menu">
                        ☰
                    </button>
                    <span className="mobile-brand mobile-only">STOCKFLOW</span>

                    {/* Right side controls */}
                    <div className="top-header-right">
                        <CountrySelector />
                    </div>
                </header>

                <div className="content-wrapper">
                    {loadingCountries ? <Spinner fullPage /> : children}
                </div>
            </main>

            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

export default Layout;
