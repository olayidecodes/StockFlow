import { useState, useEffect } from 'react';
import api from '../utils/api';

const StockAdjustmentModal = ({ isOpen, onClose, product, warehouse, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: 'ADJUSTMENT',
        cartons: 0,
        pieces: 0,
        reason: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'ADJUSTMENT',
                cartons: 0,
                pieces: 0,
                reason: '',
            });
            setError('');
        }
    }, [isOpen]);

    if (!isOpen || !product || !warehouse) return null;

    const cartonSize = product.cartonSize || 1;

    // Calculate total change preview
    const totalChange = (Number(formData.cartons) * cartonSize) + Number(formData.pieces);

    // Determine if it's adding or removing based on type for visual feedback
    const isNegative = formData.type === 'OUT' || formData.type === 'TRANSFER_OUT';
    const displayChange = isNegative ? -totalChange : totalChange;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (totalChange === 0) {
            setError('Adjustment amount cannot be zero');
            return;
        }

        setLoading(true);
        try {
            // Send total pieces to backend
            const payload = {
                product: product._id,
                warehouse: warehouse._id,
                change: displayChange,
                type: formData.type,
                reason: formData.reason,
                reference: `Manual Adjustment`,
            };

            await api.post('/inventory/adjust', payload);
            setLoading(false);
            onSuccess();
            onClose();
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Adjustment failed');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Adjust Stock</h2>
                <div className="stock-context">
                    <p><strong>Product:</strong> {product.name} (SKU: {product.sku})</p>
                    <p><strong>Warehouse:</strong> {warehouse.name}</p>
                    <p><strong>Carton Size:</strong> {cartonSize} pieces</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Action Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="IN">Stock In (+)</option>
                            <option value="OUT">Stock Out (-)</option>
                            <option value="ADJUSTMENT">Correction (±)</option>
                            {/* Transfers handled separately usually, keeping simple for now */}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Cartons</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.cartons}
                                onChange={(e) => setFormData({ ...formData, cartons: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Pieces</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pieces}
                                onChange={(e) => setFormData({ ...formData, pieces: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="preview-box">
                        <span>Total Change:</span>
                        <span className={`change-value ${isNegative ? 'negative' : 'positive'}`}>
                            {displayChange > 0 ? '+' : ''}{displayChange} Pieces
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            placeholder="Why are you making this adjustment?"
                        />
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
