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

            const res = await api.get(`/inventory/balance${query}`);
            setBalances(res.data.data);
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
                <select
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Warehouses</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>

                <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Products</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select>
            </div>

            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Warehouse</th>
                                <th>Carton Size</th>
                                <th>Current Balance</th>
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
                                        <td>{bal.warehouse?.name}</td>
                                        <td>{bal.product?.cartonSize}</td>
                                        <td>{formatQuantity(bal.quantity, bal.product?.cartonSize || 1)}</td>
                                        <td>
                                            <div className="button-group">
                                                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                                    <button
                                                        onClick={() => handleAdjustClick(bal)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        Adjust
                                                    </button>
                                                </PermissionGuard>
                                                <button
                                                    onClick={() => handleHistoryClick(bal)}
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    History
                                                </button>
                                                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                                    <button
                                                        onClick={() => handleTransferClick(bal)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        Transfer
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No stock found. {(!filterProduct || !filterWarehouse) && "Use filters to add new stock."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
