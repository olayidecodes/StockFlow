import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', active: true });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load categories');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, formData);
            } else {
                await api.post('/categories', formData);
            }
            fetchCategories();
            closeModal();
            toast.success('Category saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.msg || 'Operation failed');
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ 
                name: category.name, 
                description: category.description || '',
                active: category.active 
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', active: true });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchCategories();
                toast.success('Category deleted');
            } catch (err) {
                toast.error('Failed to delete category');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Category Management</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <FiPlus style={{ marginRight: '0.5rem' }} /> Add Category
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
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category._id}>
                                    <td>{category.name}</td>
                                    <td>
                                        <span className="text-muted">
                                            {category.description || 'No description'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${category.active ? 'active' : 'inactive'}`}>
                                            {category.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <PermissionGuard permission={PERMISSIONS.MANAGE_INVENTORY}>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => openModal(category)}
                                                    className="btn-icon"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category._id)}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                            <button onClick={closeModal} className="btn-close" title="Close"><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    placeholder="Brief description of this category"
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

export default Categories;
