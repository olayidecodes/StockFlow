import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import StockHistoryModal from '../components/StockHistoryModal';
import StockTransferModal from '../components/StockTransferModal';

const Inventory = () => {
    const [balances, setBalances] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouseTotals, setWarehouseTotals] = useState([]); // Total CBM per warehouse (matches Dashboard)
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterWarehouse, setFilterWarehouse] = useState('');
    const [filterProduct, setFilterProduct] = useState('');

    // Modals
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // { product, warehouse }

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchBalances();
    }, [filterWarehouse, filterProduct]);

    const fetchInitialData = async () => {
        try {
            const [whRes, prodRes] = await Promise.all([
                api.get('/warehouses'),
                api.get('/products?limit=1000')
            ]);
            setWarehouses(whRes.data.data);
            setProducts(prodRes.data.data);
        } catch (err) {
            console.error('Failed to load filters', err);
        }
    };

    const fetchBalances = async () => {
        setLoading(true);
        try {
            let query = '';
            const params = [];
            if (filterWarehouse) params.push(`warehouseId=${filterWarehouse}`);
            if (filterProduct) params.push(`productId=${filterProduct}`);
            if (params.length > 0) query = `?${params.join('&')}`;

            // Fetch both balance data and warehouse totals (for Dashboard correlation)
            const [balanceRes, analyticsRes] = await Promise.all([
                api.get(`/inventory/balance${query}`),
                api.get('/analytics') // Get warehouse CBM totals from Dashboard endpoint
            ]);
            
            setBalances(balanceRes.data.data);
            setWarehouseTotals(analyticsRes.data.data.warehouseCBM || []);
        } catch (err) {
            console.error('Failed to load inventory', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustClick = (balance) => {
        setSelectedItem({
            product: balance.product,
            warehouse: balance.warehouse
        });
        setIsAdjustModalOpen(true);
    };

    const handleHistoryClick = (balance) => {
        setSelectedItem({
            product: balance.product,
            warehouse: balance.warehouse
        });
        setIsHistoryModalOpen(true);
    };

    const handleTransferClick = (balance) => {
        setSelectedItem({
            product: balance.product,
            warehouse: balance.warehouse
        });
        setIsTransferModalOpen(true);
    };

    // Manual "Add Stock" for empty state (requires selecting wh and product first)
    const handleManualAdd = () => {
        // Find full objects
        const prod = products.find(p => p._id === filterProduct);
        const wh = warehouses.find(w => w._id === filterWarehouse);
        if (prod && wh) {
            setSelectedItem({ product: prod, warehouse: wh });
            setIsAdjustModalOpen(true);
        } else {
            toast.info("Please select a specific Warehouse and Product filter to add new stock.");
        }
    };

    const formatQuantity = (qty, cartonSize) => {
        const cartons = Math.floor(qty / cartonSize);
        const pieces = qty % cartonSize;
        return (
            <span>
                <strong>{cartons}</strong> ctns, {pieces} pcs
                <span className="text-muted"> ({qty} total)</span>
            </span>
        );
    };

    // Helper to link balance product with full product metadata
    const getRealProduct = (bal) => {
        if (!bal?.product) return null;
        const balProd = bal.product;
        // If product in balance already has the fields, return it
        if (balProd.price && balProd.dimensions) return balProd;

        // Otherwise, find the full product from our products state (fetched at startup)
        const id = balProd._id || balProd;
        const fullProd = products.find(p => p._id === id);
        return fullProd || balProd;
    };

    // Helper to calculate total value for a balance
    const calculateValue = (bal) => {
        const qty = bal.quantity || 0;
        const realProd = getRealProduct(bal);
        const price = realProd?.price || realProd?.wholesaleCost || 0;
        return qty * price;
    };

    // Helper to calculate total CBM for a balance
    const calculateCBM = (bal) => {
        const realProd = getRealProduct(bal);
        const prod = realProd;
        if (!prod) return 0;

        const qty = bal.quantity || 0;
        const cartonSize = prod.cartonSize || 1;
        const cartons = qty / cartonSize;

        let unitVol = prod.volume || 0;

        // Fallback: Calculate volume from dimensions if field is 0
        // Dimensions are stored in meters, so volume = length * breadth * height (m³)
        if (unitVol === 0 && prod.dimensions) {
            const { length, breadth, height } = prod.dimensions;
            unitVol = parseFloat(length) * parseFloat(breadth) * parseFloat(height);
        }

        return cartons * unitVol;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Inventory Overview</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    {filterProduct && filterWarehouse && (
                        <button onClick={handleManualAdd} className="btn btn-primary">
                            <FiPlus /> Add Stock for Selected
                        </button>
                    )}
                </PermissionGuard>
            </div>

            <div className="filters-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7A99' }}>Product Filter:</span>
                    <select
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Products</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <Spinner fullPage />
            ) : (
                <>
                    {/* Warehouse CBM Summary - Matches Dashboard */}
                    {warehouseTotals.length > 0 && (
                        <div style={{ 
                            background: '#F7FAFC', 
                            padding: '16px', 
                            borderRadius: '8px', 
                            marginBottom: '20px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <h3 style={{ 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: '#2D3748', 
                                marginBottom: '12px' 
                            }}>
                                Warehouse Volume Summary (Total CBM)
                            </h3>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                gap: '12px' 
                            }}>
                                {warehouseTotals.map((wh) => (
                                    <div key={wh.name} style={{ 
                                        background: 'white', 
                                        padding: '12px', 
                                        borderRadius: '6px',
                                        border: '1px solid #E2E8F0'
                                    }}>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: '#718096', 
                                            marginBottom: '4px' 
                                        }}>
                                            {wh.name}
                                        </div>
                                        <div style={{ 
                                            fontSize: '18px', 
                                            fontWeight: 700, 
                                            color: '#4880FF' 
                                        }}>
                                            {wh.value.toFixed(3)} m³
                                        </div>
                                        <div style={{ 
                                            fontSize: '10px', 
                                            color: '#A0AEC0', 
                                            marginTop: '2px' 
                                        }}>
                                            Matches Dashboard chart
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="table-container">
                        <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style={{ width: '180px' }}>
                                    <select
                                        value={filterWarehouse}
                                        onChange={(e) => setFilterWarehouse(e.target.value)}
                                        className="table-header-select"
                                        title="Filter by Warehouse"
                                    >
                                        <option value="">All Warehouses </option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </th>
                                <th>Carton Size</th>
                                <th>Current Balance</th>
                                <th>Total Value</th>
                                <th>Total CBM</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances.length > 0 ? (
                                balances.map((bal) => (
                                    <tr key={bal._id}>
                                        <td>
                                            <div className="cell-primary">{bal.product?.name}</div>
                                            <div className="cell-secondary">{bal.product?.sku}</div>
                                        </td>
                                        <td>
                                            {bal.warehouse?._id ? (
                                                bal.warehouse.name
                                            ) : (
                                                <span className="status-badge" style={{ background: '#F0F4FF', color: '#4880FF' }}>
                                                    {bal.warehouse?.name}
                                                </span>
                                            )}
                                        </td>
                                        <td>{bal.product?.cartonSize}</td>
                                        <td>{formatQuantity(bal.quantity, bal.product?.cartonSize || 1)}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#10B981' }}>
                                                ₦{calculateValue(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                                {(() => {
                                                    const rp = getRealProduct(bal);
                                                    return `P:${rp?.price || 0} | C:${rp?.wholesaleCost || 0} | Q:${bal.quantity || 0}`;
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-muted">
                                                {calculateCBM(bal).toFixed(3)} m³
                                            </span>
                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                                {(() => {
                                                    const rp = getRealProduct(bal);
                                                    return `V:${rp?.volume || 0} | D:${rp?.dimensions ? 'Y' : 'N'}`;
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            {bal.warehouse?._id ? (
                                                <div className="button-group" style={{ gap: '4px' }}>
                                                    <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                                        <button
                                                            onClick={() => handleAdjustClick(bal)}
                                                            className="btn btn-xs btn-secondary"
                                                            style={{ padding: '2px 6px', fontSize: '10px' }}
                                                        >
                                                            Adjust
                                                        </button>
                                                    </PermissionGuard>
                                                    <button
                                                        onClick={() => handleHistoryClick(bal)}
                                                        className="btn btn-xs btn-secondary"
                                                        style={{ padding: '2px 6px', fontSize: '10px' }}
                                                    >
                                                        History
                                                    </button>
                                                    <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                                        <button
                                                            onClick={() => handleTransferClick(bal)}
                                                            className="btn btn-xs btn-secondary"
                                                            style={{ padding: '2px 6px', fontSize: '10px' }}
                                                        >
                                                            Transfer
                                                        </button>
                                                    </PermissionGuard>
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Select warehouse to adjust</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No stock found. {(!filterProduct || !filterWarehouse) && "Use filters to add new stock."}
                                    </td>
                                </tr>
                            )}
                            {balances.length > 0 && (
                                <tr className="grand-total-row">
                                    <td colSpan="4" style={{ textAlign: 'right' }}>
                                        {filterWarehouse || filterProduct ? 'Filtered Total:' : 'Grand Total:'}
                                    </td>
                                    <td>
                                        ₦{balances.reduce((sum, b) => sum + calculateValue(b), 0)
                                            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        {balances.reduce((sum, b) => sum + calculateCBM(b), 0).toFixed(3)} m³
                                        {(filterWarehouse || filterProduct) && (
                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                                (Filtered view - see summary above for warehouse totals)
                                            </div>
                                        )}
                                    </td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>
            )}

            {selectedItem && (
                <>
                    <StockAdjustmentModal
                        isOpen={isAdjustModalOpen}
                        onClose={() => setIsAdjustModalOpen(false)}
                        product={selectedItem.product}
                        warehouse={selectedItem.warehouse}
                        onSuccess={fetchBalances}
                    />
                    <StockHistoryModal
                        isOpen={isHistoryModalOpen}
                        onClose={() => setIsHistoryModalOpen(false)}
                        product={selectedItem.product}
                        warehouse={selectedItem.warehouse}
                    />
                    <StockTransferModal
                        isOpen={isTransferModalOpen}
                        onClose={() => setIsTransferModalOpen(false)}
                        product={selectedItem.product}
                        sourceWarehouse={selectedItem.warehouse}
                        warehouses={warehouses}
                        onSuccess={fetchBalances}
                    />
                </>
            )}
        </div>
    );
};

export default Inventory;
