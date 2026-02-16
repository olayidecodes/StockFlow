import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import Spinner from '../components/Spinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Fetching analytics data...");
        api.get('/analytics')
            .then(res => {
                console.log("Analytics data received:", res.data.data);
                setData(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Analytics fetch error:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Spinner fullPage />;
    if (!data) return <div className="p-xl text-center">Failed to load data</div>;

    const { topProducts, regionalPerformance, dispatchTrends, summary } = data;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Operational Insights</h1>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-grid mb-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="dashboard-card text-center">
                    <h3>Total Orders</h3>
                    <div className="display-value">{summary.totalOrders}</div>
                    <div className="stat-label">Orders Across Warehouses</div>
                </div>
                <div className="dashboard-card text-center">
                    <h3>Active SKU Count</h3>
                    <div className="display-value">{summary.totalProducts}</div>
                    <div className="stat-label">Available Products</div>
                </div>
                <div className="dashboard-card text-center" style={{ borderColor: summary.lowStock > 0 ? 'var(--color-error)' : undefined }}>
                    <h3>Low Stock Alerts</h3>
                    <div className="display-value" style={{ color: summary.lowStock > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                        {summary.lowStock}
                    </div>
                    <div className="stat-label">Inventory Count Low</div>
                </div>
                {/* Financials (v2) */}
                <div className="dashboard-card text-center">
                    <h3>Total Inventory Qty</h3>
                    <div className="display-value">{summary.totalQuantity?.toLocaleString() || 0}</div>
                    <div className="stat-label">Units Across Warehouses</div>
                </div>

                <div className="dashboard-card text-center">
                    <h3>Total Inventory Value</h3>
                    <div className="display-value" style={{ color: '#10B981' }}>
                        ₦{summary.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <div className="stat-label">Cost Basis</div>
                </div>

                {/* <div className="dashboard-card text-center">
                    <h3>Total Volume</h3>
                    <div className="display-value">
                        {summary.totalVolume?.toFixed(2) || 0} <span style={{ fontSize: '0.5em' }}>m³</span>
                    </div>
                    <div className="stat-label">Storage Usage</div>
                </div> */}
            </div>

            <div className="dashboard-grid two-col" style={{ gridTemplateColumns: '1fr 1fr' }}>

                {/* Top Products */}
                <div className="dashboard-card" style={{ height: '400px' }}>
                    <h3>Top Selling Products</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.8em' }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4DADF7" name="Units Sold" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Regional Distribution */}
                <div className="dashboard-card" style={{ height: '400px' }}>
                    <h3>Regional Volume</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={regionalPerformance}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {regionalPerformance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Dispatch Trends (Full Width) */}
                <div className="dashboard-card main-col" style={{ height: '400px', gridColumn: 'span 2' }}>
                    <h3>Dispatch Trends (30 Days)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={dispatchTrends}>
                            <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                            <Area type="monotone" dataKey="orders" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOrders)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <style jsx>{`
                .display-value { font-size: 2.5em; font-weight: bold; margin-top: 10px; }
            `}</style>
        </div>
    );
};

export default Analytics;
