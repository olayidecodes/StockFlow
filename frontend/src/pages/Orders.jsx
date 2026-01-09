import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return 'inactive';
            case 'PENDING': return 'warning';
            case 'CONFIRMED': return 'active';
            case 'DISPATCHED': return 'success'; // Add success class later
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
                        + New Order
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
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
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
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover-row" onClick={() => navigate(`/orders/${order._id}`)}>
                                        <td className="font-mono text-sm">#{order._id.slice(-6).toUpperCase()}</td>
                                        <td>{order.customer?.name}</td>
                                        <td>{order.warehouse?.name}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>${(order.totalAmount || 0).toLocaleString()}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
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
