import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiChevronUp, FiChevronDown, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';
import ExportButton from '../components/ExportButton';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterWarehouse, setFilterWarehouse] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [expandedOrders, setExpandedOrders] = useState([]);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [filterStatus, filterWarehouse]);

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data.data);
        } catch (err) {
            console.error('Failed to load warehouses', err);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (filterWarehouse) params.append('warehouseId', filterWarehouse);
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);
            
            const query = params.toString() ? `?${params.toString()}` : '';
            console.log('Fetching orders with query:', query);
            console.log('Date range:', dateRange);
            const res = await api.get(`/orders${query}`);
            setOrders(res.data.data);
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilter = () => {
        console.log('Applying date filter:', dateRange);
        fetchOrders();
    };

    const handleClearFilters = () => {
        setDateRange({ startDate: '', endDate: '' });
        setFilterStatus('');
        setFilterWarehouse('');
        // Trigger fetch after state is cleared
        setTimeout(() => {
            fetchOrders();
        }, 100);
    };

    const toggleOrderExpansion = (orderId, e) => {
        e.stopPropagation();
        setExpandedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'CONFIRMED': return 'active';
            case 'CANCELLED': return 'discontinued';
            default: return '';
        }
    };

    // Prepare export data
    const getExportData = () => {
        return orders.map(order => ({
            orderId: `#${order.orderNumber || order._id.slice(-6).toUpperCase()}`,
            customerName: order.customer?.name || '',
            customerPhone: order.customer?.phone || '',
            customerEmail: order.customer?.email || '',
            status: order.status || '',
            channel: order.channel || '',
            warehouse: order.warehouse?.name || '',
            region: order.region || '',
            totalAmount: parseFloat((order.totalAmount || 0).toFixed(2)),
            itemCount: order.items?.length || 0,
            date: new Date(order.createdAt).toLocaleDateString()
        }));
    };

    const exportColumns = [
        { key: 'orderId', label: 'Order ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'customerPhone', label: 'Phone' },
        { key: 'customerEmail', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'channel', label: 'Channel' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'region', label: 'Region' },
        { key: 'totalAmount', label: 'Total Amount (₦)' },
        { key: 'itemCount', label: 'Items Count' },
        { key: 'date', label: 'Date' }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Orders</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {orders.length > 0 && (
                        <ExportButton
                            data={getExportData()}
                            columns={exportColumns}
                            filename={`orders-${new Date().toISOString().split('T')[0]}`}
                            label="Export"
                        />
                    )}
                    <PermissionGuard permission={PERMISSIONS.CREATE_ORDERS}>
                        <button onClick={() => navigate('/orders/new')} className="btn btn-primary">
                            <FiPlus /> New Order
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Warehouses</option>
                    {warehouses.map(wh => (
                        <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                    placeholder="Start Date"
                />
                <span>to</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                    placeholder="End Date"
                />
                <button onClick={handleDateFilter} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    Apply
                </button>
                {(dateRange.startDate || dateRange.endDate || filterStatus || filterWarehouse) && (
                    <button 
                        onClick={handleClearFilters} 
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px' }}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Warehouse</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Channel</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <Fragment key={order._id}>
                                        <tr className="hover-row" onClick={() => navigate(`/orders/${order._id}`)}>
                                            <td className="font-mono text-sm">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                                            <td>{order.customer?.name}</td>
                                            <td>{order.warehouse?.name || 'N/A'}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{order.channel || 'N/A'}</td>
                                            <td>₦{(order.totalAmount || 0).toLocaleString()}</td>
                                            <td>
                                                <div className="button-group">
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm btn-secondary toggle-btn ${expandedOrders.includes(order._id) ? 'active' : ''}`}
                                                        onClick={(e) => toggleOrderExpansion(order._id, e)}
                                                        title={expandedOrders.includes(order._id) ? 'Collapse' : 'See More'}
                                                    >
                                                        {expandedOrders.includes(order._id) ? <FiChevronUp /> : <FiChevronDown />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedOrders.includes(order._id) && (
                                            <tr className="expanded-row">
                                                <td colSpan="8" style={{ padding: 0, background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                                                    <div style={{ padding: '20px 24px' }}>
                                                        {/* Order Details Grid */}
                                                        <div style={{ 
                                                            display: 'grid', 
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                                            gap: '16px',
                                                            marginBottom: '20px',
                                                            padding: '16px',
                                                            background: '#fff',
                                                            borderRadius: '8px',
                                                            border: '1px solid #E2E8F0'
                                                        }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                                                                    Warehouse
                                                                </div>
                                                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600 }}>
                                                                    {order.warehouse?.name || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                                                                    Region
                                                                </div>
                                                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600 }}>
                                                                    {order.region?.name || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                                                                    Customer Phone
                                                                </div>
                                                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600 }}>
                                                                    {order.customer?.phone || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                                                                    Customer Email
                                                                </div>
                                                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600 }}>
                                                                    {order.customer?.email || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Order Items */}
                                                        <div style={{ 
                                                            background: '#fff',
                                                            borderRadius: '8px',
                                                            border: '1px solid #E2E8F0',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{ 
                                                                padding: '12px 16px',
                                                                background: '#F8FAFC',
                                                                borderBottom: '1px solid #E2E8F0',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                color: '#1E293B'
                                                            }}>
                                                                Order Items ({order.items?.length || 0})
                                                            </div>
                                                            <div style={{ padding: '12px' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                    <thead>
                                                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                                            <th style={{ 
                                                                                padding: '8px 12px', 
                                                                                textAlign: 'left', 
                                                                                fontSize: '0.75rem', 
                                                                                fontWeight: 600, 
                                                                                color: '#64748B',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>Product</th>
                                                                            <th style={{ 
                                                                                padding: '8px 12px', 
                                                                                textAlign: 'left', 
                                                                                fontSize: '0.75rem', 
                                                                                fontWeight: 600, 
                                                                                color: '#64748B',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>SKU</th>
                                                                            <th style={{ 
                                                                                padding: '8px 12px', 
                                                                                textAlign: 'right', 
                                                                                fontSize: '0.75rem', 
                                                                                fontWeight: 600, 
                                                                                color: '#64748B',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>Quantity</th>
                                                                            <th style={{ 
                                                                                padding: '8px 12px', 
                                                                                textAlign: 'right', 
                                                                                fontSize: '0.75rem', 
                                                                                fontWeight: 600, 
                                                                                color: '#64748B',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>Unit Price</th>
                                                                            <th style={{ 
                                                                                padding: '8px 12px', 
                                                                                textAlign: 'right', 
                                                                                fontSize: '0.75rem', 
                                                                                fontWeight: 600, 
                                                                                color: '#64748B',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {order.items?.map((item, idx) => (
                                                                            <tr key={idx} style={{ 
                                                                                borderBottom: idx < order.items.length - 1 ? '1px solid #F1F5F9' : 'none'
                                                                            }}>
                                                                                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>
                                                                                    {item.product?.name || 'Unknown Product'}
                                                                                </td>
                                                                                <td style={{ padding: '12px' }}>
                                                                                    <code style={{ 
                                                                                        fontSize: '0.75rem', 
                                                                                        color: '#64748B',
                                                                                        background: '#F1F5F9',
                                                                                        padding: '2px 6px',
                                                                                        borderRadius: '4px'
                                                                                    }}>
                                                                                        {item.product?.sku || 'N/A'}
                                                                                    </code>
                                                                                </td>
                                                                                <td style={{ 
                                                                                    padding: '12px', 
                                                                                    textAlign: 'right', 
                                                                                    fontSize: '0.85rem',
                                                                                    color: '#1E293B',
                                                                                    fontWeight: 600
                                                                                }}>
                                                                                    {item.quantity?.toLocaleString() || 0}
                                                                                </td>
                                                                                <td style={{ 
                                                                                    padding: '12px', 
                                                                                    textAlign: 'right', 
                                                                                    fontSize: '0.85rem',
                                                                                    color: '#64748B'
                                                                                }}>
                                                                                    ₦{(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                </td>
                                                                                <td style={{ 
                                                                                    padding: '12px', 
                                                                                    textAlign: 'right', 
                                                                                    fontSize: '0.85rem',
                                                                                    color: '#10B981',
                                                                                    fontWeight: 600
                                                                                }}>
                                                                                    ₦{((item.quantity || 0) * (item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr style={{ borderTop: '2px solid #E2E8F0' }}>
                                                                            <td colSpan="4" style={{ 
                                                                                padding: '12px', 
                                                                                textAlign: 'right',
                                                                                fontSize: '0.9rem',
                                                                                fontWeight: 600,
                                                                                color: '#1E293B'
                                                                            }}>
                                                                                Total Amount:
                                                                            </td>
                                                                            <td style={{ 
                                                                                padding: '12px', 
                                                                                textAlign: 'right',
                                                                                fontSize: '1rem',
                                                                                fontWeight: 700,
                                                                                color: '#4880FF'
                                                                            }}>
                                                                                ₦{(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Orders;
