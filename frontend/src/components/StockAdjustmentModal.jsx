import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const StockAdjustmentModal = ({ isOpen, onClose, product, warehouse, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: 'ADJUSTMENT',
        cartons: 0,
        pieces: 0,
        reason: '',
        selectedProduct: product?._id || '',
        selectedWarehouse: warehouse?._id || ''
    });

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Fetch products and warehouses if not provided
    useEffect(() => {
        if (isOpen && (!product || !warehouse)) {
            setLoadingData(true);
            Promise.all([
                api.get('/products?limit=1000'),
                api.get('/warehouses')
            ]).then(([prodRes, whRes]) => {
                setProducts(prodRes.data.data);
                setWarehouses(whRes.data.data);
                setLoadingData(false);
            }).catch(err => {
                console.error('Failed to load data', err);
                setLoadingData(false);
            });
        }
    }, [isOpen, product, warehouse]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'ADJUSTMENT',
                cartons: 0,
                pieces: 0,
                reason: '',
                selectedProduct: product?._id || '',
                selectedWarehouse: warehouse?._id || ''
            });
        }
    }, [isOpen, product, warehouse]);

    if (!isOpen) return null;

    // Get the actual product and warehouse objects
    const currentProduct = product || products.find(p => p._id === formData.selectedProduct);
    const currentWarehouse = warehouse || warehouses.find(w => w._id === formData.selectedWarehouse);
    const cartonSize = currentProduct?.cartonSize || 1;

    // Calculate total change preview
    const totalChange = (Number(formData.cartons) * cartonSize) + Number(formData.pieces);

    // Determine if it's adding or removing based on type for visual feedback
    const isNegative = formData.type === 'OUT' || formData.type === 'TRANSFER_OUT';
    const displayChange = isNegative ? -totalChange : totalChange;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentProduct || !currentWarehouse) {
            toast.error('Please select both product and warehouse');
            return;
        }

        if (totalChange === 0) {
            toast.error('Adjustment amount cannot be zero');
            return;
        }

        setLoading(true);
        try {
            // Send total pieces to backend
            const payload = {
                product: currentProduct._id,
                warehouse: currentWarehouse._id,
                change: displayChange,
                type: formData.type,
                reason: formData.reason,
                reference: `Manual Adjustment`,
            };

            await api.post('/inventory/adjust', payload);
            setLoading(false);
            toast.success('Stock adjusted successfully');
            onSuccess();
            onClose();
        } catch (err) {
            setLoading(false);
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Adjustment failed');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Adjust Stock</h2>
                    <button onClick={onClose} className="btn-close" title="Close"><FiX /></button>
                </div>
                <div className="stock-context">
                    {!product && (
                        <div className="form-group">
                            <label>Product</label>
                            <select
                                value={formData.selectedProduct}
                                onChange={(e) => setFormData({ ...formData, selectedProduct: e.target.value })}
                                required
                                disabled={loadingData}
                            >
                                <option value="">Select a product...</option>
                                {products.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {!warehouse && (
                        <div className="form-group">
                            <label>Warehouse</label>
                            <select
                                value={formData.selectedWarehouse}
                                onChange={(e) => setFormData({ ...formData, selectedWarehouse: e.target.value })}
                                required
                                disabled={loadingData}
                            >
                                <option value="">Select a warehouse...</option>
                                {warehouses.map(w => (
                                    <option key={w._id} value={w._id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {currentProduct && currentWarehouse && (
                        <>
                            <p><strong>Product:</strong> {currentProduct.name} (SKU: {currentProduct.sku})</p>
                            <p><strong>Warehouse:</strong> {currentWarehouse.name}</p>
                            <p><strong>Carton Size:</strong> {cartonSize} pieces</p>
                        </>
                    )}
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
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Cartons</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.cartons || ''}
                                onChange={(e) => setFormData({ ...formData, cartons: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Pieces</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pieces || ''}
                                onChange={(e) => setFormData({ ...formData, pieces: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="preview-box">
                        <span>Total Change: </span>
                        <span 
                            className={`change-value ${isNegative ? 'negative' : 'positive'}`}
                            style={{ 
                                color: displayChange === 0 ? '#64748B' : (isNegative ? '#DC2626' : '#10B981'),
                                fontWeight: 600,
                                fontSize: '1.1rem'
                            }}
                        >
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

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Spinner size={20} color="#fff" /> : 'Confirm Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
