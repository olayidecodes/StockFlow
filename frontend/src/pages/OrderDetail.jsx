import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data.data);
        } catch (err) {
            setError('Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        setActionLoading(true);
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            fetchOrder(); // Reload to get updates logs and allocated check
            toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Status update failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (error || !order) return <div className="page-container"><div className="alert alert-error">{error || 'Order not found'}</div></div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex-col">
                    <button className="btn btn-secondary btn-sm mb-sm" onClick={() => navigate('/orders')}>← Back to Orders</button>
                    <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
                </div>

                <div className="header-actions">
                    <PermissionGuard permission={PERMISSIONS.MANAGE_ORDERS}>
                        {order.status === 'PENDING' && (
                            <div className="button-group" style={{ flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleStatusChange('CONFIRMED')}
                                    disabled={actionLoading}
                                >
                                    Confirm Order
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleStatusChange('CANCELLED')}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </PermissionGuard>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Main Info */}
                <div className="dashboard-card main-col">
                    <div className="order-meta mb-xl">
                        <span className={`status-badge lg ${order.status.toLowerCase()}`}>
                            {order.status}
                        </span>
                        <span className="text-muted ml-md">
                            Created {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h3>Items</h3>

                    {/* Desktop Table View */}
                    <div className="table-container mb-xl desktop-only">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Qty (Pieces)</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, idx) => {
                                    const cartonSize = item.product?.cartonSize || 1;
                                    const cartons = Math.floor(item.quantity / cartonSize);
                                    const pieces = item.quantity % cartonSize;

                                    return (
                                        <tr key={idx}>
                                            <td>{item.product?.name} ({cartonSize}pc/ctn)</td>
                                            <td>{item.product?.sku}</td>
                                            <td>
                                                {item.quantity} pcs
                                                {cartonSize > 1 && (
                                                    <div className="text-sm text-muted">
                                                        ({cartons} ctn, {pieces} pcs)
                                                    </div>
                                                )}
                                            </td>
                                            <td>₦{item.price || 0}</td>
                                            <td>₦{(item.quantity * (item.price || 0)).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-elevated">
                                    <td colSpan="4" className="text-right font-bold">Total Amount:</td>
                                    <td className="font-bold">₦{order.totalAmount?.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-only mb-xl">
                        {order.items.map((item, idx) => {
                            const cartonSize = item.product?.cartonSize || 1;
                            const cartons = Math.floor(item.quantity / cartonSize);
                            const pieces = item.quantity % cartonSize;
                            const total = item.quantity * (item.price || 0);

                            return (
                                <div key={idx} className="mobile-card mb-md" style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>{item.product?.name}</strong>
                                        <div className="text-sm text-muted">{item.product?.sku}</div>
                                        <div className="text-sm text-muted">({cartonSize}pc/ctn)</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div>
                                            <div className="text-sm text-muted">Quantity</div>
                                            <div>{item.quantity} pcs</div>
                                            {cartonSize > 1 && (
                                                <div className="text-sm text-muted">
                                                    ({cartons} ctn, {pieces} pcs)
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted">Unit Price</div>
                                            <div>₦{item.price || 0}</div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                                            <div className="text-sm text-muted">Total</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₦{total.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div style={{
                            backgroundColor: '#f5f5f5',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <strong>Total Amount:</strong>
                            <strong style={{ fontSize: '1.2rem' }}>₦{order.totalAmount?.toLocaleString()}</strong>
                        </div>
                    </div>

                    <h3>Order Log</h3>
                    <div className="logs-list">
                        {order.logs.map((log, i) => (
                            <div key={i} className="log-item" style={{ flexWrap: 'wrap' }}>
                                <span className="text-sm text-muted">{new Date(log.date).toLocaleString()}</span>
                                <strong>{log.status}</strong>
                                <span className="text-sm">by {log.changedBy?.email}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="dashboard-card sidebar-col">
                    <h3>Customer</h3>
                    <div className="info-group mb-lg">
                        <p><strong>{order.customer?.name}</strong></p>
                        <p className="text-muted">{order.customer?.address}</p>
                        <p>{order.customer?.phone}</p>
                        <p>{order.customer?.email}</p>
                    </div>

                    <h3 className="mt-xl">Fulfillment</h3>
                    <div className="info-group">
                        <div className="detail-item">
                            <span className="label">Warehouse:</span>
                            <span>{order.warehouse?.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Channel:</span>
                            <span>{order.channel || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                }
                @media (min-width: 769px) {
                    .mobile-only {
                        display: none !important;
                    }
                    .desktop-only {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderDetail;
