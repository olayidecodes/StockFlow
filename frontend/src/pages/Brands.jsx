import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({ name: '', active: true });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await api.get('/brands');
            setBrands(res.data.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load brands');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await api.put(`/brands/${editingBrand._id}`, formData);
            } else {
                await api.post('/brands', formData);
            }
            fetchBrands();
            closeModal();
            toast.success('Brand saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.msg || 'Operation failed');
        }
    };

    const openModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({ name: brand.name, active: brand.active });
        } else {
            setEditingBrand(null);
            setFormData({ name: '', active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
        setFormData({ name: '', active: true });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this brand?')) {
            try {
                await api.delete(`/brands/${id}`);
                fetchBrands();
                toast.success('Brand deleted');
            } catch (err) {
                toast.error('Failed to delete brand');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Brand Management</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <FiPlus style={{ marginRight: '0.5rem' }} /> Add Brand
                    </button>
                </PermissionGuard>
            </div>



            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand._id}>
                                    <td>{brand.name}</td>
                                    <td>
                                        <span className={`status-badge ${brand.active ? 'active' : 'inactive'}`}>
                                            {brand.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => openModal(brand)}
                                                    className="btn-icon"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(brand._id)}
                                                    className="btn-icon delete"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </PermissionGuard>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingBrand ? 'Edit Brand' : 'New Brand'}</h2>
                            <button onClick={closeModal} className="btn-close" title="Close"><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Brand Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Brands;
