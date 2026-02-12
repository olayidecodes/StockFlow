import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiChevronUp, FiChevronDown, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedOrders, setExpandedOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = '';
            if (filterStatus) query = `?status=${filterStatus}`;
            const res = await api.get(`/orders${query}`);
            setOrders(res.data.data);
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Orders</h1>
                <PermissionGuard permission={PERMISSIONS.CREATE_ORDERS}>
                    <button onClick={() => navigate('/orders/new')} className="btn btn-primary">
                        <FiPlus /> New Order
                    </button>
                </PermissionGuard>
            </div>

            <div className="filters-bar">
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
                                <th>Status</th>
                                <th>Channel</th>
                                <th>Total</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <Fragment key={order._id}>
                                        <tr className="hover-row" onClick={() => navigate(`/orders/${order._id}`)}>
                                            <td className="font-mono text-sm">#{order._id.slice(-6).toUpperCase()}</td>
                                            <td>{order.customer?.name}</td>
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
                                                <td colSpan="6">
                                                    <div className="expanded-content">
                                                        <div className="expanded-header">
                                                            <div className="warehouse-info">
                                                                <span className="info-label">Warehouse:</span>
                                                                <span className="warehouse-name">{order.warehouse?.name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="order-items-minimal">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="minimal-item">
                                                                    <div className="item-info">
                                                                        <span className="item-name">{item.product?.name}</span>
                                                                        <span className="item-sku text-muted">{item.product?.sku}</span>
                                                                    </div>
                                                                    <div className="item-stats">
                                                                        <span className="item-qty"><strong>{item.quantity}</strong> pcs</span>
                                                                        <span className="item-total">₦{(item.quantity * (item.price || 0)).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No orders found.</td>
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
