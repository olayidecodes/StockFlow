import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [filterBrand, setFilterBrand] = useState('');

    const initialForm = {
        name: '',
        sku: '',
        brand: '',
        cartonSize: 1,
        status: 'ACTIVE',
        weight: 0,
        cartonWeight: 0,
        wholesaleCost: 0,
        dimensions: { length: 0, breadth: 0, height: 0 }
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
            toast.error('Failed to load data');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert dimensions from cm to m for backend
            const payload = {
                ...formData,
                dimensions: {
                    length: (formData.dimensions?.length || 0) / 100,
                    breadth: (formData.dimensions?.breadth || 0) / 100,
                    height: (formData.dimensions?.height || 0) / 100
                }
            };
            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, payload);
            } else {
                await api.post('/products', payload);
            }
            fetchData();
            closeModal();
            toast.success('Product saved successfully');
        } catch (err) {
            const errorMsg = err.response?.data?.errors?.[0]?.msg
                || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message[0] : err.response?.data?.message)
                || 'Operation failed';
            toast.error(errorMsg);
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                brand: product.brand._id || product.brand, // Handle populated or id
                cartonSize: product.cartonSize,
                status: product.status,
                weight: product.weight || 0,
                cartonWeight: (product.weight || 0) * (product.cartonSize || 1),
                wholesaleCost: product.wholesaleCost || 0,
                dimensions: product.dimensions ? {
                    length: (product.dimensions.length || 0) * 100,
                    breadth: (product.dimensions.breadth || 0) * 100,
                    height: (product.dimensions.height || 0) * 100
                } : { length: 0, breadth: 0, height: 0 }
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
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchData();
                toast.success('Product deleted');
            } catch (err) {
                toast.error('Failed to delete product');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Product Management</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <FiPlus /> Add Product
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



            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>SKU</th>
                                <th>Name</th>
                                <th>Brand</th>
                                <th>Wholesale</th>
                                <th>Dimensions (cm)</th>
                                <th>Weight</th>
                                <th>Carton Size</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td className="font-mono text-xs" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.sku}</td>
                                    <td>{product.name}</td>
                                    <td>{product.brand?.name || 'Unknown'}</td>
                                    <td>₦{product.wholesaleCost?.toFixed(2) || '0.00'}</td>
                                    <td className="text-secondary">
                                        {product.dimensions ? (
                                            `${Math.round(product.dimensions.length * 100)}, ${Math.round(product.dimensions.breadth * 100)}, ${Math.round(product.dimensions.height * 100)}`
                                        ) : '-'}
                                    </td>
                                    <td>{product.weight?.toFixed(2) || '0.00'} kg</td>
                                    <td>{product.cartonSize}</td>
                                    <td>
                                        <span className={`status-badge ${product.status.toLowerCase()}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                            <div className="action-buttons">
                                                <button onClick={() => openModal(product)} className="btn-icon" title="Edit Product"><FiEdit2 /></button>
                                                <button onClick={() => handleDelete(product._id)} className="btn-icon delete" title="Delete Product"><FiTrash2 /></button>
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
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={closeModal} className="btn-close" title="Close"><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>SKU (Unique)</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
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
                                    onChange={(e) => {
                                        const newSize = parseInt(e.target.value) || 0;
                                        setFormData({
                                            ...formData,
                                            cartonSize: newSize,
                                            // Update carton weight display based on constant piece weight
                                            cartonWeight: (formData.weight * newSize)
                                        });
                                    }}
                                    onWheel={(e) => e.target.blur()}
                                    required
                                />
                                <small className="form-help-text">Mandatory. Cannot change if orders exist.</small>
                            </div>



                            <div className="form-group">
                                <label>Unit Wholesale Cost (per piece)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.wholesaleCost || ''}
                                    onChange={(e) => setFormData({ ...formData, wholesaleCost: parseFloat(e.target.value) || 0 })}
                                    onWheel={(e) => e.target.blur()}
                                />
                            </div>

                            <div className="form-group">
                                <label>Carton Weight (kg)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.cartonWeight}
                                    onChange={(e) => {
                                        const newCartonWeight = e.target.value; // Keep as string to allow decimals
                                        const pieceWeight = formData.cartonSize > 0 ? (parseFloat(newCartonWeight) || 0) / formData.cartonSize : 0;
                                        setFormData({
                                            ...formData,
                                            cartonWeight: newCartonWeight,
                                            weight: pieceWeight
                                        });
                                    }}
                                    onWheel={(e) => e.target.blur()}
                                />
                                <small className="form-help-text">
                                    Estimated weight per piece: {(formData.weight || 0).toFixed(2)} kg
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Carton Dimensions (Centimeters)</label>
                                <div className="dimensions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75em', marginBottom: '2px', display: 'block' }}>Length (cm)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.dimensions?.length || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                dimensions: { ...formData.dimensions, length: e.target.value }
                                            })}
                                            onWheel={(e) => e.target.blur()}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75em', marginBottom: '2px', display: 'block' }}>Breadth (cm)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.dimensions?.breadth || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                dimensions: { ...formData.dimensions, breadth: e.target.value }
                                            })}
                                            onWheel={(e) => e.target.blur()}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75em', marginBottom: '2px', display: 'block' }}>Height (cm)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.dimensions?.height || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                dimensions: { ...formData.dimensions, height: e.target.value }
                                            })}
                                            onWheel={(e) => e.target.blur()}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div className="text-sm mt-xs text-secondary">
                                    Calculated Volume: {
                                        ((parseFloat(formData.dimensions?.length) || 0) *
                                            (parseFloat(formData.dimensions?.breadth) || 0) *
                                            (parseFloat(formData.dimensions?.height) || 0) / 1000000).toFixed(4)
                                    } m³
                                </div>
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
