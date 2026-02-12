import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiAlertTriangle } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        avgSaleValue: 0,
        avgItems: 0,
        pendingTransfers: 0,
        pendingOrders: 0,
        salesTrend: [],
        compareSales: 0,
        compareItems: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch analytics summary and orders
                const [analyticsRes, ordersRes] = await Promise.all([
                    api.get('/analytics'),
                    api.get('/orders?limit=100') // Fetch recent orders for calculation
                ]);

                const analytics = analyticsRes.data.data;
                const orders = ordersRes.data.data || [];

                // Calculate Pending counts
                const pendingCount = orders.filter(o => o.status === 'PENDING').length;

                // Process Sales Trend from analytics dispatchTrends
                const salesTrend = analytics.dispatchTrends?.map(item => ({
                    date: item.date,
                    value: item.orders
                })) || [];

                setStats({
                    totalSales: analytics.summary.totalValue || 0,
                    avgSaleValue: 0,
                    avgItems: 0,
                    lowStock: analytics.summary.lowStock || 0,
                    pendingOrders: pendingCount,
                    recentOrders: orders.slice(0, 5), // Store recent orders for display
                    salesTrend: salesTrend,
                    compareSales: 0,
                    compareItems: 0
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <Spinner fullPage />;

    // Use fetched data or fallback to empty array to prevent chart errors
    const salesData = stats.salesTrend.length > 0 ? stats.salesTrend : [
        { date: 'No Data', value: 0 }
    ];

    const targetData = [
        { date: '1 Apr', value: 1000 },
        { date: '5 Apr', value: 3500 },
        { date: '10 Apr', value: 2000 },
        { date: '15 Apr', value: 5500 },
        { date: '20 Apr', value: 8500 },
        { date: '25 Apr', value: 6000 },
        { date: '30 Apr', value: 8000 },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Header Section */}
            <div className="dashboard-header-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', lineHeight: '1.1', marginBottom: '0.5rem' }}>
                        Hi, here's what's happening<br />
                        in your stores
                    </h1>
                </div>
                <div className="time-filters" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="btn-group" style={{ background: '#fff', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0', display: 'flex' }}>
                        <button className="filter-btn active" style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Today</button>
                        <button className="filter-btn" style={{ padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>This Week</button>
                        <button className="filter-btn" style={{ padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>This Month</button>
                    </div>
                    <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: '500' }}>
                        <option>All Outlets</option>
                    </select>
                </div>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Main Sales Card */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ color: '#64748b', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>This month your stores have sold</h3>
                                <div style={{ fontSize: '2.8rem', fontWeight: '700', color: '#1a1b1e' }}>
                                    ${stats.totalSales.toLocaleString()}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    That's <span style={{ color: '#10b981', fontWeight: '600' }}>$1,780.24 more</span> than this time last month!
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Average Sale Value</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>${stats.avgSaleValue}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Average Items per Sale</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.avgItems}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>0.95 items than last month</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '250px', marginTop: '2rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4e157" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#d4e157" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#c0ca33" strokeWidth={3} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Row - Sales Target */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Your Sales this Month</h3>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>+ SHOW MORE RETAIL METRICS</span>
                        </div>

                        <div style={{ height: '200px', marginBottom: '1.5rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={targetData}>
                                    <defs>
                                        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4e157" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#d4e157" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#c0ca33" strokeWidth={2} fill="url(#colorTarget)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1b1e' }}>Your Sales Targets</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>$800.80</div>
                                <a href="#" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'underline', marginTop: '0.5rem', display: 'block' }}>Set a sales target</a>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1b1e' }}>Average Sales Targets</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>$61.34</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>$20.95 less than last month</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1b1e' }}>Average Items per Sale</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>8</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>0.08 more than last month</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Low Stock Alerts (Replaces Transfer) */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Low Stock Alerts</h3>
                            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Needs Attention</span>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            You have <span style={{ fontWeight: '700', color: '#ef4444' }}>{stats.lowStock || 0} items</span> below safety stock levels.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '50px', height: '50px', background: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#ef4444' }}>
                                <FiAlertTriangle />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600' }}>Review Inventory</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                    Check stock levels immediately
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/inventory/balance')}
                            style={{ background: 'transparent', border: 'none', color: '#1a1b1e', fontWeight: '700', fontSize: '0.85rem', padding: 0, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                            VIEW STOCK LEVELS
                        </button>
                    </div>

                    {/* Recent Orders (Replaces Purchase Orders) */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Recent Orders</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontWeight: '700', color: '#1a1b1e' }}>{stats.pendingOrders || 0} orders</span> are currently pending dispatch.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {stats.recentOrders && stats.recentOrders.slice(0, 3).map(order => (
                                <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontWeight: '500' }}>{order.orderNumber}</span>
                                    <span className={`status-badge ${order.status.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{order.status}</span>
                                </div>
                            ))}
                            {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No recent orders</div>
                            )}
                        </div>

                        <button style={{ background: 'transparent', border: 'none', color: '#1a1b1e', fontWeight: '700', fontSize: '0.85rem', padding: 0, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }} onClick={() => navigate('/orders')}>
                            VIEW ALL ORDERS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
