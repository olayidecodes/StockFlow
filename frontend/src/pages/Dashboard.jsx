import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FiShoppingCart, FiAward, FiTarget, FiActivity, FiUser } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trendDays, setTrendDays] = useState(30);
    const [stats, setStats] = useState({
        summary: {
            totalOrders: 0,
            topSellingBrand: '...',
            topProductQty: '...',
            topProductValue: '...'
        },
        warehouseCBM: [],
        dispatchTrends: [],
        topCustomers: []
    });

    const fetchDashboardData = async (days) => {
        try {
            setLoading(true);
            const response = await api.get(`/analytics?days=${days}`);
            setStats(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(trendDays);
    }, [trendDays]);

    if (loading && stats.summary.totalOrders === 0) return <Spinner fullPage />;

    const statCards = [
        {
            title: 'Total Orders',
            value: stats.summary.totalOrders.toLocaleString(),
            icon: <FiShoppingCart />,
            color: '#4880FF',
            bgColor: '#EBF1FF'
        },
        {
            title: 'Top Brand',
            value: stats.summary.topSellingBrand,
            icon: <FiAward />,
            color: '#10b981',
            bgColor: '#ECFDF5'
        },
        {
            title: 'Top Product (Qty)',
            value: stats.summary.topProductQty,
            icon: <FiTarget />,
            color: '#f59e0b',
            bgColor: '#FFFBEB'
        },
        {
            title: 'Top Product (Value)',
            value: stats.summary.topProductValue,
            icon: <FiActivity />,
            color: '#ef4444',
            bgColor: '#FEF2F2'
        }
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Header */}
            <div className="dash-header">
                <h1>Dashboard Overview</h1>
            </div>

            {/* Stat Cards Row */}
            <div className="stat-cards-row">
                {statCards.map((card, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-card-icon" style={{ background: card.bgColor, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-label">{card.title}</span>
                            <span className="stat-card-value" title={card.value}>{card.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Row: CBM and Dispatch Trends */}
            <div className="charts-row">
                {/* Warehouse CBM Volume */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Warehouse Volume (CBM)</h3>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.warehouseCBM} layout="vertical" barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9EDF5" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#1E2640', fontSize: 11, fontWeight: 500 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#4880FF" radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dispatch Trends */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Dispatch Trends</h3>
                        <div className="filter-buttons" style={{ display: 'flex', gap: '4px' }}>
                            {[7, 30, 60].map(d => (
                                <button
                                    key={d}
                                    className={`btn btn-xs ${trendDays === d ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setTrendDays(d)}
                                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.dispatchTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF5" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 10 }} hide={trendDays > 30} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Customers */}
            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Top Customers</h3>
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>By Sales Value</span>
                </div>
                <div className="table-container" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Last Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topCustomers?.length > 0 ? (
                                stats.topCustomers.map((customer, idx) => (
                                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders?customer=${customer._id}`)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0F4FF', color: '#4880FF', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <FiUser style={{ margin: 'auto' }} />
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{customer._id}</span>
                                            </div>
                                        </td>
                                        <td>{customer.orderCount}</td>
                                        <td style={{ fontWeight: 600, color: '#1E2640' }}>₦{(customer.totalSpent || 0).toLocaleString()}</td>
                                        <td style={{ color: '#6B7A99' }}>{new Date(customer.lastOrder).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center" style={{ color: '#A3AED0', fontStyle: 'italic', padding: '2rem' }}>
                                        No customer data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
