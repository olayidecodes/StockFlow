import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const StockHistoryModal = ({ isOpen, onClose, product, warehouse }) => {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && product && warehouse) {
            fetchHistory();
        }
    }, [isOpen, product, warehouse]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/inventory/ledger?productId=${product._id}&warehouseId=${warehouse._id}`);
            setLedger(res.data.data);
        } catch (err) {
            console.error('Failed to load ledger', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !product || !warehouse) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content large-modal">
                <div className="modal-header">
                    <h2>Stock History</h2>
                    <button onClick={onClose} className="btn-close" title="Close"><FiX /></button>
                </div>
                <div className="stock-context">
                    <p><strong>{product.name}</strong> at <strong>{warehouse.name}</strong></p>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem' }}><Spinner /></div>
                ) : (
                    <div className="table-container max-h-400">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Change</th>
                                    <th>Balance</th>
                                    <th>By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map((entry) => (
                                    <tr key={entry._id}>
                                        <td className="text-muted text-sm">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${entry.change > 0 ? 'active' : 'discontinued'}`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={entry.change > 0 ? 'text-success' : 'text-error'}>
                                                {entry.change > 0 ? '+' : ''}{entry.change}
                                            </span>
                                        </td>
                                        <td>{entry.balanceAfter}</td>
                                        <td className="text-sm">{entry.performedBy?.email?.split('@')[0] || 'System'}</td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && (
                                    <tr><td colSpan="5" className="text-center">No history found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockHistoryModal;
