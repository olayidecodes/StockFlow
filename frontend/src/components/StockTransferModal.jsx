import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const StockTransferModal = ({ isOpen, onClose, product, sourceWarehouse, warehouses, onSuccess }) => {
    const [formData, setFormData] = useState({
        destinationWarehouse: '',
        cartons: 0,
        pieces: 0,
        reason: '',
    });

    const [loading, setLoading] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                destinationWarehouse: '',
                cartons: 0,
                pieces: 0,
                reason: '',
            });
        }
    }, [isOpen]);

    if (!isOpen || !product || !sourceWarehouse) return null;

    const cartonSize = product.cartonSize || 1;
    const totalQuantity = (Number(formData.cartons) * cartonSize) + Number(formData.pieces);

    // Filter out source warehouse from destination options
    const availableWarehouses = warehouses.filter(w => w._id !== sourceWarehouse._id);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (totalQuantity === 0) {
            toast.error('Transfer quantity cannot be zero');
            return;
        }

        if (!formData.destinationWarehouse) {
            toast.error('Please select a destination warehouse');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                product: product._id,
                sourceWarehouse: sourceWarehouse._id,
                destinationWarehouse: formData.destinationWarehouse,
                quantity: totalQuantity,
                reason: formData.reason,
            };

            await api.post('/inventory/transfer', payload);
            setLoading(false);
            toast.success('Stock transferred successfully');
            onSuccess();
            onClose();
        } catch (err) {
            setLoading(false);
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Transfer failed');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Transfer Stock</h2>
                <div className="stock-context">
                    <p><strong>Product:</strong> {product.name} (SKU: {product.sku})</p>
                    <p><strong>From Warehouse:</strong> {sourceWarehouse.name}</p>
                    <p><strong>Carton Size:</strong> {cartonSize} pieces</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Destination Warehouse *</label>
                        <select
                            value={formData.destinationWarehouse}
                            onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                            required
                        >
                            <option value="">Select Warehouse...</option>
                            {availableWarehouses.map(w => (
                                <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Cartons</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.cartons}
                                onChange={(e) => setFormData({ ...formData, cartons: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Pieces</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pieces}
                                onChange={(e) => setFormData({ ...formData, pieces: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="preview-box">
                        <span>Total Transfer:</span>
                        <span className="change-value positive">
                            {totalQuantity} Pieces
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Reason *</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            placeholder="Why are you transferring this stock?"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockTransferModal;
