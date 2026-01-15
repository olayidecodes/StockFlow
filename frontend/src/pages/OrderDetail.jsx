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
            <div className="page-header">
                <div className="flex-col">
                    <button className="btn btn-secondary btn-sm mb-sm" onClick={() => navigate('/orders')}>← Back to Orders</button>
                    <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
                </div>

                <div className="header-actions">
                    <PermissionGuard permission={PERMISSIONS.MANAGE_ORDERS}>
                        {order.status === 'PENDING' && (
                            <div className="button-group">
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
                    <div className="table-container mb-xl">
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
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.product?.name} ({item.product?.cartonSize}pc/ctn)</td>
                                        <td>{item.product?.sku}</td>
                                        <td>{item.quantity}</td>
                                        <td>${item.price || 0}</td>
                                        <td>${(item.quantity * (item.price || 0)).toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-elevated">
                                    <td colSpan="4" className="text-right font-bold">Total Amount:</td>
                                    <td className="font-bold">${order.totalAmount?.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3>Order Log</h3>
                    <div className="logs-list">
                        {order.logs.map((log, i) => (
                            <div key={i} className="log-item">
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
                        <p className="info-label">Warehouse</p>
                        <p className="mb-md">{order.warehouse?.name}</p>

                        <p className="info-label">Region</p>
                        <p>{order.region?.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
