import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
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

    if (loading) return <Spinner fullPage />;
    if (error || !order) return <div className="page-container"><div className="alert alert-error">{error || 'Order not found'}</div></div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex-col">
                    <button className="btn btn-secondary btn-sm mb-sm" onClick={() => navigate('/orders')}>
                        <FiArrowLeft /> Back to Orders
                    </button>
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
                                    <FiCheck /> Confirm Order
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleStatusChange('CANCELLED')}
                                    disabled={actionLoading}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        )}
                    </PermissionGuard>
                </div>
            </div>

            <div className="order-details-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card mb-xl" style={{ marginBottom: '1rem' }}>
                    <h3 className="mb-lg border-bottom pb-sm">Order Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <div>
                            <h4 className="text-muted text-sm uppercase mb-md">Customer</h4>
                            <div className="info-group">
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{order.customer?.name}</p>
                                <p className="text-muted mb-xs">{order.customer?.address}</p>
                                <p className="mb-xs">{order.customer?.phone}</p>
                                <p className="text-sm text-primary">{order.customer?.email}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-muted text-sm uppercase mb-md">Order Info</h4>
                            <div className="info-group">
                                <p className="mb-xs"><strong>Order ID:</strong> #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="mb-xs"><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p className="mb-xs"><strong>Status:</strong> <span className={`status-badge ${order.status.toLowerCase()} ml-sm`}>{order.status}</span></p>
                                <p className="mb-xs"><strong>Channel:</strong> {order.channel || 'N/A'}</p>
                                <p><strong>Warehouse:</strong> {order.warehouse?.name}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-muted text-sm uppercase mb-md">Total Amount</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)', lineHeight: '1' }}>
                                ₦{order.totalAmount?.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-xl" style={{ marginBottom: '1rem' }}>
                    <h3 className="mb-lg border-bottom pb-sm">Items</h3>
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
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{item.product?.name}</div>
                                                <div className="text-xs text-muted">Carton Size: {cartonSize}</div>
                                            </td>
                                            <td>{item.product?.sku}</td>
                                            <td>
                                                <span style={{ fontWeight: 'bold' }}>{item.quantity} pcs</span>
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
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 className="mb-lg border-bottom pb-sm">Order Log</h3>
                    <div className="logs-list">
                        {order.logs.map((log, i) => (
                            <div key={i} className="log-item" style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem 0',
                                borderBottom: '1px solid #f1f5f9',
                                gap: '1rem'
                            }}>
                                <span className="text-sm text-muted" style={{ minWidth: '150px' }}>{new Date(log.date).toLocaleString()}</span>
                                <strong className={`status-badge small ${log.status.toLowerCase()}`}>{log.status}</strong>
                                <span className="text-sm text-muted">by {log.changedBy?.email || 'System'}</span>
                            </div>
                        ))}
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
