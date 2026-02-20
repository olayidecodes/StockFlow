import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FiAlertTriangle, FiPackage, FiShoppingCart, FiTrendingUp, FiBox, FiFilter } from 'react-icons/fi';
import Spinner from '../components/Spinner';
import { ROLES } from '../utils/constants';

const COLORS = ['#4880FF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [stockFilter, setStockFilter] = useState('all');
    const [burnRateFilter, setBurnRateFilter] = useState('all');

    useEffect(() => {
        api.get('/analytics').then(res => { setData(res.data.data); setLoading(false); }).catch(err => { console.error("Analytics fetch error:", err); setLoading(false); });
    }, []);

    if (loading) return <Spinner fullPage />;
    if (!data) return <div className="page-container"><div className="text-center">Failed to load data</div></div>;

    const { topProducts, regionalPerformance, dispatchTrends, summary, lowStockProducts = [], aggregatedLowStock = [], burnRateData = [] } = data;
    const filteredLowStock = lowStockProducts.filter(item => { if (stockFilter === 'critical') return item.quantity < 50; if (stockFilter === 'low') return item.quantity >= 50 && item.quantity < 150; return true; });
    const criticalCount = lowStockProducts.filter(item => item.quantity < 50).length;
    const lowCount = lowStockProducts.filter(item => item.quantity >= 50 && item.quantity < 150).length;

    // Aggregated low stock filtering
    const filteredAggregatedLowStock = aggregatedLowStock.filter(item => {
        if (stockFilter === 'critical') return item.totalQuantity < 200;
        if (stockFilter === 'low') return item.totalQuantity >= 200 && item.totalQuantity < 400;
        return true;
    });
    const aggregatedCriticalCount = aggregatedLowStock.filter(item => item.totalQuantity < 200).length;
    const aggregatedLowCount = aggregatedLowStock.filter(item => item.totalQuantity >= 200 && item.totalQuantity < 400).length;

    // Burn rate filtering
    const filteredBurnRate = burnRateData.filter(item => {
        if (burnRateFilter === 'all') return true;
        return item.burnRateCategory === burnRateFilter.toUpperCase();
    });

    const burnRateCounts = {
        fast: burnRateData.filter(i => i.burnRateCategory === 'FAST').length,
        moderate: burnRateData.filter(i => i.burnRateCategory === 'MODERATE').length,
        slow: burnRateData.filter(i => i.burnRateCategory === 'SLOW').length,
        stagnant: burnRateData.filter(i => i.burnRateCategory === 'STAGNANT').length
    };

    const statCards = [
        { title: 'Total Orders', value: summary.totalOrders.toLocaleString(), icon: <FiShoppingCart />, color: '#4880FF', subtitle: 'All time orders' },
        { title: 'Active Products', value: summary.totalProducts.toLocaleString(), icon: <FiPackage />, color: '#10b981', subtitle: 'SKUs in catalog' },
        { title: 'Low Stock Alerts', value: summary.lowStock, icon: <FiAlertTriangle />, color: summary.lowStock > 0 ? '#ef4444' : '#10b981', subtitle: 'Items below threshold', alert: summary.lowStock > 0 },
        ...(user?.role === ROLES.ADMIN ? [{ title: 'Inventory Value', value: `₦${(summary.totalValue || 0).toLocaleString()}`, icon: <FiTrendingUp />, color: '#8b5cf6', subtitle: 'Total stock value' }] : [])
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Operational Insights</h1>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.5rem' }}>Real-time analytics and performance metrics</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0' }}>
                <button onClick={() => setActiveTab('overview')} style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'overview' ? '#4880FF' : '#64748B', fontWeight: activeTab === 'overview' ? 600 : 500, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'overview' ? '2px solid #4880FF' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.2s' }}>Overview</button>
                <button onClick={() => setActiveTab('burnrate')} style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'burnrate' ? '#4880FF' : '#64748B', fontWeight: activeTab === 'burnrate' ? 600 : 500, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'burnrate' ? '2px solid #4880FF' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Stock Movement
                    {burnRateData.length > 0 && <span style={{ background: '#E0F2FE', color: '#075985', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{burnRateData.length}</span>}
                </button>
                <button onClick={() => setActiveTab('lowstock')} style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'lowstock' ? '#4880FF' : '#64748B', fontWeight: activeTab === 'lowstock' ? 600 : 500, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'lowstock' ? '2px solid #4880FF' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Low Stock (Per Warehouse)
                    {summary.lowStock > 0 && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{summary.lowStock}</span>}
                </button>
                <button onClick={() => setActiveTab('aggregated')} style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'aggregated' ? '#4880FF' : '#64748B', fontWeight: activeTab === 'aggregated' ? 600 : 500, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'aggregated' ? '2px solid #4880FF' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Low Stock (All Warehouses)
                    {aggregatedLowStock.length > 0 && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{aggregatedLowStock.length}</span>}
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="stat-cards-row" style={{ marginBottom: '2rem' }}>
                        {statCards.map((card, i) => (
                            <div className="stat-card" key={i} style={{ borderLeft: `3px solid ${card.color}` }}>
                                <div className="stat-card-icon" style={{ color: card.color }}>{card.icon}</div>
                                <div className="stat-card-label">{card.title}</div>
                                <div className="stat-card-value" style={{ color: card.alert ? '#ef4444' : '#1E2640' }}>{card.value}</div>
                                <div style={{ fontSize: '0.75rem', color: '#A3AED0', marginTop: '0.25rem' }}>{card.subtitle}</div>
                            </div>
                        ))}
                    </div>

                    {summary.lowStock > 0 && (
                        <div onClick={() => setActiveTab('lowstock')} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'} onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiAlertTriangle size={24} style={{ color: '#DC2626' }} />
                                <div>
                                    <h3 style={{ margin: 0, color: '#991B1B', fontSize: '1rem' }}>{summary.lowStock} Product{summary.lowStock !== 1 ? 's' : ''} Running Low</h3>
                                    <p style={{ margin: '0.25rem 0 0 0', color: '#7F1D1D', fontSize: '0.875rem' }}>Click to view details and take action</p>
                                </div>
                            </div>
                            <div style={{ padding: '0.5rem 1rem', background: '#DC2626', color: '#fff', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600 }}>View Details →</div>
                        </div>
                    )}

                    <div className="charts-row" style={{ marginBottom: '2rem' }}>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <h3>Top Selling Products</h3>
                                <span style={{ fontSize: '0.8rem', color: '#A3AED0' }}>By quantity sold</span>
                            </div>
                            <div className="chart-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={topProducts} layout="vertical" barCategoryGap="20%">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9EDF5" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 11 }} />
                                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#1E2640', fontSize: 11, fontWeight: 500 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#4880FF" radius={[0, 4, 4, 0]} barSize={14} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="chart-card-header">
                                <h3>Regional Distribution</h3>
                                <span style={{ fontSize: '0.8rem', color: '#A3AED0' }}>Order volume by region</span>
                            </div>
                            <div className="chart-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={regionalPerformance} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {regionalPerformance.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3>Dispatch Trends</h3>
                            <span style={{ fontSize: '0.8rem', color: '#A3AED0' }}>Last 30 days order activity</span>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dispatchTrends}>
                                    <defs><linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF5" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 11 }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1E293B' }}><FiBox style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Inventory Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div><div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.25rem' }}>Total Units in Stock</div><div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1E293B' }}>{summary.totalQuantity?.toLocaleString() || 0}</div></div>
                            {user?.role === ROLES.ADMIN && (
                                <div><div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.25rem' }}>Total Inventory Value</div><div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>₦{(summary.totalValue || 0).toLocaleString()}</div></div>
                            )}
                            <div><div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.25rem' }}>Top Selling Brand</div><div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1E293B' }}>{summary.topSellingBrand}</div></div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'burnrate' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.5rem', background: '#D1FAE5', border: '2px solid #6EE7B7', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#065F46', marginBottom: '0.5rem' }}>Fast Moving</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981' }}>{burnRateCounts.fast}</div>
                            <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>Stock out in less than 30 days</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '0.5rem' }}>Moderate</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{burnRateCounts.moderate}</div>
                            <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '0.25rem' }}>Stock out in 30-90 days</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#FEE2E2', border: '2px solid #FCA5A5', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#991B1B', marginBottom: '0.5rem' }}>Slow Moving</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#EF4444' }}>{burnRateCounts.slow}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '0.25rem' }}>Stock out in more than 90 days</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#F1F5F9', border: '2px solid #CBD5E1', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Stagnant</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#64748B' }}>{burnRateCounts.stagnant}</div>
                            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.25rem' }}>No sales in last 30 days</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                        <FiFilter style={{ color: '#64748B' }} />
                        <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Filter:</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { value: 'all', label: 'All', count: burnRateData.length },
                                { value: 'fast', label: 'Fast Moving', count: burnRateCounts.fast },
                                { value: 'moderate', label: 'Moderate', count: burnRateCounts.moderate },
                                { value: 'slow', label: 'Slow Moving', count: burnRateCounts.slow },
                                { value: 'stagnant', label: 'Stagnant', count: burnRateCounts.stagnant }
                            ].map(filter => (
                                <button key={filter.value} onClick={() => setBurnRateFilter(filter.value)} style={{ padding: '0.5rem 1rem', border: burnRateFilter === filter.value ? '2px solid #4880FF' : '1px solid #E2E8F0', background: burnRateFilter === filter.value ? '#F0F4FF' : '#fff', color: burnRateFilter === filter.value ? '#4880FF' : '#64748B', borderRadius: '6px', fontSize: '0.875rem', fontWeight: burnRateFilter === filter.value ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '0.875rem', color: '#1E40AF' }}>
                        <strong>Analysis Period:</strong> Last 30 days | <strong>Calculation:</strong> Daily Sales Rate = Total Sold ÷ 30 | Days Until Stockout = Current Stock ÷ Daily Sales Rate
                    </div>

                    {filteredBurnRate.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <FiPackage size={48} style={{ color: '#CBD5E1', marginBottom: '1rem' }} />
                            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Stock Movement Data</h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No products match the selected filter</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Brand</th>
                                        <th>Current Stock</th>
                                        <th>Sold (30 days)</th>
                                        <th>Daily Sales Rate</th>
                                        <th>Days Until Stockout</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBurnRate.map((item, idx) => {
                                        const statusConfig = {
                                            FAST: { bg: '#D1FAE5', color: '#065F46', label: 'Fast Moving' },
                                            MODERATE: { bg: '#FEF3C7', color: '#92400E', label: 'Moderate' },
                                            SLOW: { bg: '#FEE2E2', color: '#991B1B', label: 'Slow Moving' },
                                            STAGNANT: { bg: '#F1F5F9', color: '#475569', label: 'Stagnant' }
                                        };
                                        const status = statusConfig[item.burnRateCategory] || statusConfig.STAGNANT;
                                        
                                        return (
                                            <tr key={idx}>
                                                <td><span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748B' }}>{item.sku}</span></td>
                                                <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                                <td>{item.brand}</td>
                                                <td><span style={{ fontWeight: 600 }}>{item.currentStock?.toLocaleString() || 0}</span> units</td>
                                                <td><span style={{ color: '#10B981', fontWeight: 600 }}>{item.totalSold?.toLocaleString() || 0}</span> units</td>
                                                <td><span style={{ color: '#4880FF', fontWeight: 600 }}>{item.dailySalesRate || 0}</span> units/day</td>
                                                <td>
                                                    <span style={{ 
                                                        fontWeight: 600,
                                                        color: item.daysUntilStockout < 30 ? '#DC2626' : item.daysUntilStockout < 90 ? '#F59E0B' : '#64748B'
                                                    }}>
                                                        {item.daysUntilStockout > 999 ? '∞' : `${item.daysUntilStockout} days`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: status.bg,
                                                        color: status.color
                                                    }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Showing {filteredBurnRate.length} products</span>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Based on sales velocity from last 30 days</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'lowstock' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.5rem', background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#991B1B', marginBottom: '0.5rem' }}>Critical Stock</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#DC2626' }}>{criticalCount}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '0.25rem' }}>Below 50 units per warehouse</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '0.5rem' }}>Low Stock</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{lowCount}</div>
                            <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '0.25rem' }}>50-149 units per warehouse</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#F0F9FF', border: '2px solid #BAE6FD', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#075985', marginBottom: '0.5rem' }}>Total Affected</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0284C7' }}>{lowStockProducts.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#0C4A6E', marginTop: '0.25rem' }}>Products below threshold</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                        <FiFilter style={{ color: '#64748B' }} />
                        <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Filter:</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[{ value: 'all', label: 'All', count: lowStockProducts.length }, { value: 'critical', label: 'Critical', count: criticalCount }, { value: 'low', label: 'Low', count: lowCount }].map(filter => (
                                <button key={filter.value} onClick={() => setStockFilter(filter.value)} style={{ padding: '0.5rem 1rem', border: stockFilter === filter.value ? '2px solid #4880FF' : '1px solid #E2E8F0', background: stockFilter === filter.value ? '#F0F4FF' : '#fff', color: stockFilter === filter.value ? '#4880FF' : '#64748B', borderRadius: '6px', fontSize: '0.875rem', fontWeight: stockFilter === filter.value ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredLowStock.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <FiPackage size={48} style={{ color: '#CBD5E1', marginBottom: '1rem' }} />
                            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Low Stock Items</h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>All products are adequately stocked</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Brand</th>
                                        <th>Warehouse</th>
                                        <th>Current Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLowStock.map((item, idx) => (
                                        <tr key={idx}>
                                            <td><span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748B' }}>{item.sku}</span></td>
                                            <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                            <td>{item.brand}</td>
                                            <td>{item.warehouse}</td>
                                            <td><span style={{ fontWeight: 600, color: item.quantity < 50 ? '#DC2626' : '#F59E0B' }}>{item.quantity} units</span></td>
                                            <td><span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: item.quantity < 50 ? '#FEE2E2' : '#FEF3C7', color: item.quantity < 50 ? '#991B1B' : '#92400E' }}>{item.quantity < 50 ? 'Critical' : 'Low'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Showing {filteredLowStock.length} of {lowStockProducts.length} low stock items</span>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Thresholds: Critical less than 50, Low less than 150 units per warehouse</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'aggregated' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.5rem', background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#991B1B', marginBottom: '0.5rem' }}>Critical Stock</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#DC2626' }}>{aggregatedCriticalCount}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '0.25rem' }}>Below 200 units total</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '0.5rem' }}>Low Stock</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{aggregatedLowCount}</div>
                            <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '0.25rem' }}>200-399 units total</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#F0F9FF', border: '2px solid #BAE6FD', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#075985', marginBottom: '0.5rem' }}>Total Affected</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0284C7' }}>{aggregatedLowStock.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#0C4A6E', marginTop: '0.25rem' }}>Products below threshold</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                        <FiFilter style={{ color: '#64748B' }} />
                        <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Filter:</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[{ value: 'all', label: 'All', count: aggregatedLowStock.length }, { value: 'critical', label: 'Critical', count: aggregatedCriticalCount }, { value: 'low', label: 'Low', count: aggregatedLowCount }].map(filter => (
                                <button key={filter.value} onClick={() => setStockFilter(filter.value)} style={{ padding: '0.5rem 1rem', border: stockFilter === filter.value ? '2px solid #4880FF' : '1px solid #E2E8F0', background: stockFilter === filter.value ? '#F0F4FF' : '#fff', color: stockFilter === filter.value ? '#4880FF' : '#64748B', borderRadius: '6px', fontSize: '0.875rem', fontWeight: stockFilter === filter.value ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredAggregatedLowStock.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <FiPackage size={48} style={{ color: '#CBD5E1', marginBottom: '1rem' }} />
                            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Low Stock Items</h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>All products are adequately stocked across all warehouses</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Brand</th>
                                        <th>Total Stock (All Warehouses)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAggregatedLowStock.map((item, idx) => (
                                        <tr key={idx}>
                                            <td><span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748B' }}>{item.sku}</span></td>
                                            <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                            <td>{item.brand}</td>
                                            <td><span style={{ fontWeight: 600, color: item.totalQuantity < 200 ? '#DC2626' : '#F59E0B' }}>{item.totalQuantity} units</span></td>
                                            <td><span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: item.totalQuantity < 200 ? '#FEE2E2' : '#FEF3C7', color: item.totalQuantity < 200 ? '#991B1B' : '#92400E' }}>{item.totalQuantity < 200 ? 'Critical' : 'Low'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Showing {filteredAggregatedLowStock.length} of {aggregatedLowStock.length} low stock items</span>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Thresholds: Critical less than 200, Low less than 400 units across all warehouses</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Analytics;
