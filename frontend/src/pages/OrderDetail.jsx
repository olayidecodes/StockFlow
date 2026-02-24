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
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/orders')}
                        style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiArrowLeft /> Back to Orders
                    </button>
                    <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', color: '#1E293B' }}>
                        Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Created on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                <PermissionGuard permission={PERMISSIONS.MANAGE_ORDERS}>
                    {order.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleStatusChange('CONFIRMED')}
                                disabled={actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiCheck /> Confirm Order
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleStatusChange('CANCELLED')}
                                disabled={actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiX /> Cancel Order
                            </button>
                        </div>
                    )}
                </PermissionGuard>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Status and Total Banner */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ 
                        padding: '1.5rem', 
                        background: order.status === 'CONFIRMED' ? '#D1FAE5' : order.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7',
                        border: `2px solid ${order.status === 'CONFIRMED' ? '#6EE7B7' : order.status === 'CANCELLED' ? '#FCA5A5' : '#FCD34D'}`,
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Order Status
                        </div>
                        <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 700, 
                            color: order.status === 'CONFIRMED' ? '#065F46' : order.status === 'CANCELLED' ? '#991B1B' : '#92400E'
                        }}>
                            {order.status}
                        </div>
                    </div>

                    <div style={{ 
                        padding: '1.5rem', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        color: '#fff'
                    }}>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                            Total Amount
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1' }}>
                            ₦{order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div style={{ 
                        padding: '1.5rem', 
                        background: '#F0F9FF',
                        border: '2px solid #BAE6FD',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Items Count
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0284C7' }}>
                            {order.items?.length || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0C4A6E', marginTop: '0.25rem' }}>
                            {order.items?.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} total pieces
                        </div>
                    </div>
                </div>

                {/* Customer and Order Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ 
                        padding: '1.5rem', 
                        background: '#fff', 
                        borderRadius: '12px', 
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #E2E8F0' }}>
                            Customer Information
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Name</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>{order.customer?.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Address</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{order.customer?.address}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Phone</div>
                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500 }}>{order.customer?.phone || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Email</div>
                                <div style={{ fontSize: '0.9rem', color: '#4880FF', fontWeight: 500 }}>{order.customer?.email || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        padding: '1.5rem', 
                        background: '#fff', 
                        borderRadius: '12px', 
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #E2E8F0' }}>
                            Order Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Order ID</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>
                                    #{order._id.slice(-6).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Warehouse</div>
                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500 }}>{order.warehouse?.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Region</div>
                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500 }}>{order.region?.name || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Channel</div>
                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500 }}>{order.channel || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div style={{ 
                    padding: '1.5rem', 
                    background: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #E2E8F0' }}>
                        Order Items
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SKU</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit Price</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, idx) => {
                                    const cartonSize = item.product?.cartonSize || 1;
                                    const cartons = Math.floor(item.quantity / cartonSize);
                                    const pieces = item.quantity % cartonSize;

                                    return (
                                        <tr key={idx} style={{ borderBottom: idx < order.items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                                            <td style={{ padding: '16px 12px' }}>
                                                <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
                                                    {item.product?.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                    Carton Size: {cartonSize}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <code style={{ 
                                                    fontSize: '0.75rem', 
                                                    color: '#64748B',
                                                    background: '#F1F5F9',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {item.product?.sku}
                                                </code>
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                                                    {item.quantity} pcs
                                                </div>
                                                {cartonSize > 1 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                                                        ({cartons} ctn, {pieces} pcs)
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right', color: '#64748B', fontSize: '0.9rem' }}>
                                                ₦{(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                                                ₦{(item.quantity * (item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '3px solid #E2E8F0' }}>
                                    <td colSpan="4" style={{ padding: '16px 12px', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
                                        Total Amount:
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '1.25rem', fontWeight: 800, color: '#4880FF' }}>
                                        ₦{order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Order Log */}
                <div style={{ 
                    padding: '1.5rem', 
                    background: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #E2E8F0' }}>
                        Order Activity Log
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.logs.map((log, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                background: '#F8FAFC',
                                borderRadius: '8px',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#64748B', 
                                    minWidth: '180px',
                                    fontFamily: 'monospace'
                                }}>
                                    {new Date(log.date).toLocaleString()}
                                </span>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: log.status === 'CONFIRMED' ? '#D1FAE5' : log.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7',
                                    color: log.status === 'CONFIRMED' ? '#065F46' : log.status === 'CANCELLED' ? '#991B1B' : '#92400E'
                                }}>
                                    {log.status}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                                    by <strong>{log.changedBy?.email || 'System'}</strong>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
