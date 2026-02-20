import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import ExportButton from '../components/ExportButton';

const CustomerAnalytics = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRecurringOnly, setShowRecurringOnly] = useState(false);

    useEffect(() => {
        fetchCustomerAnalytics();
    }, [showRecurringOnly]);

    const fetchCustomerAnalytics = async () => {
        setLoading(true);
        try {
            const query = showRecurringOnly ? '?recurring=true' : '';
            const res = await api.get(`/analytics/customers${query}`);
            setCustomers(res.data.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load customer analytics');
            setLoading(false);
        }
    };

    // Prepare export data
    const getExportData = () => {
        return customers.map(customer => ({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            orderCount: customer.orderCount || 0,
            totalSpent: parseFloat((customer.totalSpent || 0).toFixed(2)),
            avgOrderValue: parseFloat((customer.avgOrderValue || 0).toFixed(2)),
            lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : ''
        }));
    };

    const exportColumns = [
        { key: 'name', label: 'Customer Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'orderCount', label: 'Total Orders' },
        { key: 'totalSpent', label: 'Total Spent (₦)' },
        { key: 'avgOrderValue', label: 'Avg Order Value (₦)' },
        { key: 'lastOrderDate', label: 'Last Order Date' }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Customer Analytics</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {customers.length > 0 && (
                        <ExportButton
                            data={getExportData()}
                            columns={exportColumns}
                            filename={`customer-analytics-${new Date().toISOString().split('T')[0]}`}
                            label="Export"
                        />
                    )}
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="recurringOnly"
                            checked={showRecurringOnly}
                            onChange={(e) => setShowRecurringOnly(e.target.checked)}
                        />
                        <label htmlFor="recurringOnly">Show Recurring Customers Only</label>
                    </div>
                </div>
            </div>

            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Contact</th>
                                <th>Total Orders</th>
                                <th>Total Spent</th>
                                <th>Last Order</th>
                                <th>Most Ordered Products</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? (
                                customers.map((customer, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="cell-primary">{customer._id}</div>
                                            {customer.isRecurring && (
                                                <span className="status-badge active" style={{ fontSize: '0.7em', marginTop: '4px' }}>
                                                    Recurring
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div>{customer.customerPhone || 'N/A'}</div>
                                            <div className="cell-secondary">{customer.customerEmail || ''}</div>
                                        </td>
                                        <td>{customer.totalOrders}</td>
                                        <td>₦{(customer.totalSpent || 0).toLocaleString()}</td>
                                        <td>{new Date(customer.lastOrderDate).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ maxWidth: '300px' }}>
                                                {customer.topProducts?.slice(0, 3).map((prod, i) => (
                                                    <div key={i} className="cell-secondary" style={{ marginBottom: '4px' }}>
                                                        <strong>{prod.name}</strong> ({prod.sku}) - {prod.quantity} pcs
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        No customers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CustomerAnalytics;
