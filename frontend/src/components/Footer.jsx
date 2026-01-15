import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-brand-section">
                    <div className="footer-logo">
                        <span className="footer-brand-name">StockFlow</span>
                    </div>
                    <p className="footer-description">
                        Streamline your inventory management with professional-grade tools for tracking, analytics, and order management.
                    </p>
                </div>

                <div className="footer-links-section">
                    <div className="footer-link-group">
                        <h4>Quick Links</h4>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/analytics">Analytics</Link>
                        <Link to="/orders">Orders</Link>
                    </div>
                    <div className="footer-link-group">
                        <h4>Inventory</h4>
                        <Link to="/inventory/balance">Stock Balance</Link>
                        <Link to="/inventory/products">Products</Link>
                        <Link to="/inventory/brands">Brands</Link>
                    </div>
                    <div className="footer-link-group">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">Documentation</a>
                        <a href="#">API Reference</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-bottom-content">
                    <p>&copy; {currentYear} StockFlow. All rights reserved.</p>
                    <div className="footer-legal">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
