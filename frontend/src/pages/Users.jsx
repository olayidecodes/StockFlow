import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ role: '', isActive: true });

    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data);
            setLoading(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch users');
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        if (user._id === currentUser.id) {
            toast.warning("You cannot edit your own permissions here.");
            return;
        }
        setEditingUser(user);
        setEditForm({
            role: user.role,
            isActive: user.isActive
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/users/${editingUser._id}`, editForm);
            toast.success('User updated successfully');
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            console.error('Update Error:', err);
            toast.error(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        if (userId === currentUser.id) return toast.error("You cannot delete yourself");
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

        try {
            await api.delete(`/users/${userId}`);
            toast.success('User deleted');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user');
        }
    }

    if (loading) return <div className="p-xl text-center">Loading users...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>User Management</h1>
                <p>Manage access and permissions</p>
            </div>

            <div className="card-container" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Metrics</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                                <td>
                                    <div className="font-bold">{u.username}</div>
                                    <div className="text-secondary text-sm">{u.email}</div>
                                </td>
                                <td>
                                    <span className="badge badge-neutral">{u.role}</span>
                                </td>
                                <td>
                                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="text-sm">
                                    Created: {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleEdit(u)}
                                            disabled={u._id === currentUser.id}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(u._id)}
                                            disabled={u._id === currentUser.id}
                                            title="Delete User"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h2>Edit User</h2>
                        <div className="mb-md">
                            <strong>{editingUser.username}</strong> ({editingUser.email})
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                                    <option value="SALES">Sales</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                                <small className="text-secondary">
                                    Admins have full access. Managers can adjust stock. Sales can create orders.
                                </small>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        style={{ width: 'auto' }}
                                    />
                                    <span>Active Account</span>
                                </label>
                                <small className="text-secondary block mt-xs">
                                    Inactive users cannot log in.
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th, .data-table td { text-align: left; padding: 1rem; border-bottom: 1px solid var(--color-border); }
                .data-table th { color: var(--color-text-secondary); font-weight: 600; font-size: 0.9rem; }
                .badge { padding: 0.25rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-error { background: #fee2e2; color: #991b1b; }
                .badge-neutral { background: #f3f4f6; color: #374151; }
                .text-sm { font-size: 0.875rem; }
                .flex { display: flex; }
                .gap-2 { gap: 0.5rem; }
                .items-center { align-items: center; }
                .cursor-pointer { cursor: pointer; }
                .block { display: block; }
                .mb-md { margin-bottom: 1rem; }
                .checkbox-group input { margin-right: 0.5rem; }
            `}</style>
        </div>
    );
};

export default Users;
