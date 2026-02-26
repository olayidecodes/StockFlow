import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Bundles = () => {
    const [bundles, setBundles] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        products: [],
        status: 'ACTIVE'
    });

    useEffect(() => {
        fetchBundles();
        fetchProducts();
    }, []);

    const fetchBundles = async () => {
        try {
            const res = await api.get('/bundles');
            setBundles(res.data.data);
        } catch (err) {
            toast.error('Failed to load bundles');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?limit=1000');
            setProducts(res.data.data.filter(p => p.status === 'ACTIVE'));
        } catch (err) {
            console.error('Failed to load products', err);
        }
    };

    const handleOpenModal = (bundle = null) => {
        if (bundle) {
            setEditingBundle(bundle);
            setFormData({
                name: bundle.name,
                description: bundle.description || '',
                products: bundle.products.map(p => ({
                    product: p.product._id,
                    quantity: p.quantity
                })),
                status: bundle.status
            });
        } else {
            setEditingBundle(null);
            setFormData({
                name: '',
                description: '',
                products: [],
                status: 'ACTIVE'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBundle(null);
        setFormData({
            name: '',
            description: '',
            products: [],
            status: 'ACTIVE'
        });
    };

    const addProductToBundle = () => {
        setFormData({
            ...formData,
            products: [...formData.products, { product: '', quantity: 1 }]
        });
    };

    const removeProductFromBundle = (index) => {
        const newProducts = [...formData.products];
        newProducts.splice(index, 1);
        setFormData({ ...formData, products: newProducts });
    };

    const updateBundleProduct = (index, field, value) => {
        const newProducts = [...formData.products];
        newProducts[index][field] = value;
        setFormData({ ...formData, products: newProducts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.products.length === 0) {
            return toast.error('Bundle must contain at least one product');
        }

        try {
            if (editingBundle) {
                await api.put(`/bundles/${editingBundle._id}`, formData);
                toast.success('Bundle updated successfully');
            } else {
                await api.post('/bundles', formData);
                toast.success('Bundle created successfully');
            }
            handleCloseModal();
            fetchBundles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save bundle');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bundle?')) return;

        try {
            await api.delete(`/bundles/${id}`);
            toast.success('Bundle deleted successfully');
            fetchBundles();
        } catch (err) {
            toast.error('Failed to delete bundle');
        }
    };

    const calculateBundleRetailPrice = (bundle) => {
        return bundle.products.reduce((sum, item) => {
            return sum + (item.quantity * (item.product?.price || 0));
        }, 0);
    };

    const calculateBundleWholesalePrice = (bundle) => {
        return bundle.products.reduce((sum, item) => {
            return sum + (item.quantity * (item.product?.wholesaleCost || 0));
        }, 0);
    };

    if (loading) return <Spinner fullPage />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Product Bundles</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <FiPlus /> Create Bundle
                    </button>
                </PermissionGuard>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Bundle Name</th>
                            <th>Products</th>
                            <th>Retail Price</th>
                            <th>Wholesale Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bundles.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">No bundles found</td>
                            </tr>
                        ) : (
                            bundles.map(bundle => (
                                <tr key={bundle._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{bundle.name}</div>
                                        {bundle.description && (
                                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                {bundle.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '12px' }}>
                                            {bundle.products.map((item, idx) => (
                                                <div key={idx} style={{ marginBottom: '2px' }}>
                                                    {item.quantity}x {item.product?.name}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td>₦{calculateBundleRetailPrice(bundle).toLocaleString()}</td>
                                    <td>₦{calculateBundleWholesalePrice(bundle).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${bundle.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                                            {bundle.status}
                                        </span>
                                    </td>
                                    <td>
                                        <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleOpenModal(bundle)}
                                                    className="btn-icon edit"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bundle._id)}
                                                    className="btn-icon delete"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </PermissionGuard>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bundle Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>{editingBundle ? 'Edit Bundle' : 'Create Bundle'}</h2>
                            <button onClick={handleCloseModal} className="modal-close">
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Bundle Name *</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Bundle Products *</span>
                                        <button
                                            type="button"
                                            onClick={addProductToBundle}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            <FiPlus /> Add Product
                                        </button>
                                    </label>
                                    
                                    {formData.products.length === 0 ? (
                                        <div style={{ 
                                            padding: '20px', 
                                            textAlign: 'center', 
                                            color: '#64748B',
                                            background: '#F7FAFC',
                                            borderRadius: '6px'
                                        }}>
                                            No products added. Click "Add Product" to start building your bundle.
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '10px' }}>
                                            {formData.products.map((item, idx) => (
                                                <div key={idx} style={{ 
                                                    display: 'flex', 
                                                    gap: '10px', 
                                                    marginBottom: '10px',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <div style={{ flex: 2 }}>
                                                        <select
                                                            value={item.product}
                                                            onChange={e => updateBundleProduct(idx, 'product', e.target.value)}
                                                            required
                                                            style={{ width: '100%' }}
                                                        >
                                                            <option value="">Select Product</option>
                                                            {products.map(p => (
                                                                <option key={p._id} value={p._id}>
                                                                    {p.name} ({p.sku})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ width: '100px' }}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => updateBundleProduct(idx, 'quantity', parseInt(e.target.value))}
                                                            placeholder="Qty"
                                                            required
                                                            style={{ width: '100%' }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductFromBundle(idx)}
                                                        className="btn-icon delete"
                                                        title="Remove"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bundles;
