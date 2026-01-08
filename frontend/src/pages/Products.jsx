import { useState, useEffect } from 'react';
import api from '../utils/api';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [filterBrand, setFilterBrand] = useState('');

    const initialForm = {
        name: '',
        sku: '',
        brand: '',
        cartonSize: 1,
        status: 'ACTIVE'
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchData();
    }, [filterBrand]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, brandsRes] = await Promise.all([
                api.get(`/products${filterBrand ? `?brandId=${filterBrand}` : ''}`),
                api.get('/brands')
            ]);
            setProducts(productsRes.data.data);
            setBrands(brandsRes.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load data');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.msg || 'Operation failed');
        }
    };

    const openModal = (product = null) => {
        setError('');
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                brand: product.brand._id || product.brand, // Handle populated or id
                cartonSize: product.cartonSize,
                status: product.status
            });
        } else {
            setEditingProduct(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(initialForm);
        setError('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchData();
            } catch (err) {
                setError('Failed to delete product');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Product Management</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        + Add Product
                    </button>
                </PermissionGuard>
            </div>

            <div className="filters">
                <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Brands</option>
                    {brands.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Brand</th>
                                <th>Carton Size</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td className="font-mono">{product.sku}</td>
                                    <td>{product.name}</td>
                                    <td>{product.brand?.name || 'Unknown'}</td>
                                    <td>{product.cartonSize}</td>
                                    <td>
                                        <span className={`status-badge ${product.status.toLowerCase()}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                            <div className="action-buttons">
                                                <button onClick={() => openModal(product)} className="btn-icon">✎</button>
                                                <button onClick={() => handleDelete(product._id)} className="btn-icon delete">🗑️</button>
                                            </div>
                                        </PermissionGuard>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>SKU (Unique)</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    required
                                    disabled={!!editingProduct} // Basic SKU immutability preference, but not strict requirement
                                    placeholder="e.g., SAM-S24-BLK"
                                />
                            </div>
                            <div className="form-group">
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Brand</label>
                                <select
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                >
                                    <option value="">Select Brand</option>
                                    {brands.filter(b => b.active).map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Carton Size (Pieces per Carton)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.cartonSize}
                                    onChange={(e) => setFormData({ ...formData, cartonSize: parseInt(e.target.value) })}
                                    required
                                />
                                <small className="form-help-text">Mandatory. Cannot change if orders exist.</small>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="DISCONTINUED">Discontinued</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
