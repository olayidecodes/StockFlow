import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiMapPin, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../utils/constants';
import { useCountry } from '../context/CountryContext';

const Locations = () => {
    const { activeCountry } = useCountry();
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState(null);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [selectedRegionId, setSelectedRegionId] = useState(null);

    // Forms
    const [regionForm, setRegionForm] = useState({ name: '', active: true });
    const [warehouseForm, setWarehouseForm] = useState({ name: '', active: true, region: '' });

    useEffect(() => {
        if (activeCountry?._id) fetchLocations();
    }, [activeCountry?._id]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/regions?countryId=${activeCountry._id}`);
            setRegions(res.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load locations');
            setLoading(false);
        }
    };

    // --- Region Handlers ---
    const handleRegionSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRegion) {
                await api.put(`/regions/${editingRegion._id}`, regionForm);
            } else {
                await api.post('/regions', { ...regionForm, countryId: activeCountry?._id });
            }
            fetchLocations();
            closeRegionModal();
            toast.success('Region saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.msg || 'Operation failed');
        }
    };

    const deleteRegion = async (id) => {
        if (window.confirm('Delete this region? WARNING: This may affect associated warehouses.')) {
            try {
                await api.delete(`/regions/${id}`);
                fetchLocations();
                toast.success('Region deleted');
            } catch (err) {
                toast.error('Failed to delete region');
            }
        }
    };

    // --- Warehouse Handlers ---
    const handleWarehouseSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWarehouse) {
                await api.put(`/warehouses/${editingWarehouse._id}`, warehouseForm);
            } else {
                await api.post('/warehouses', { ...warehouseForm, countryId: activeCountry?._id });
            }
            fetchLocations();
            closeWarehouseModal();
            toast.success('Warehouse saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.msg || 'Operation failed');
        }
    };

    const deleteWarehouse = async (id) => {
        if (window.confirm('Delete this warehouse?')) {
            try {
                await api.delete(`/warehouses/${id}`);
                fetchLocations();
                toast.success('Warehouse deleted');
            } catch (err) {
                toast.error('Failed to delete warehouse');
            }
        }
    };

    // --- Modal Helpers ---
    const openRegionModal = (region = null) => {
        if (region) {
            setEditingRegion(region);
            setRegionForm({ name: region.name, active: region.active });
        } else {
            setEditingRegion(null);
            setRegionForm({ name: '', active: true });
        }
        setIsRegionModalOpen(true);
    };

    const openWarehouseModal = (regionId, warehouse = null) => {
        setSelectedRegionId(regionId);
        if (warehouse) {
            setEditingWarehouse(warehouse);
            setWarehouseForm({
                name: warehouse.name,
                active: warehouse.active,
                region: regionId
            });
        } else {
            setEditingWarehouse(null);
            setWarehouseForm({
                name: '',
                active: true,
                region: regionId
            });
        }
        setIsWarehouseModalOpen(true);
    };

    const closeRegionModal = () => setIsRegionModalOpen(false);
    const closeWarehouseModal = () => setIsWarehouseModalOpen(false);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Locations</h1>
                <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                    <button onClick={() => openRegionModal()} className="btn btn-primary">
                        <FiPlus style={{ marginRight: '0.5rem' }} /> New Region
                    </button>
                </PermissionGuard>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <Spinner fullPage />
            ) : (
                <div className="regions-grid">
                    {regions.map((region) => (
                        <div key={region._id} className="region-card">
                            <div className="region-header">
                                <div className="region-title">
                                    <h3><FiMapPin style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }} />{region.name}</h3>
                                    <span className={`status-badge ${region.active ? 'active' : 'inactive'}`}>
                                        {region.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                                    <div className="action-buttons">
                                        <button onClick={() => openRegionModal(region)} className="btn-icon" title="Edit Region">
                                            <FiEdit2 />
                                        </button>
                                        <button onClick={() => deleteRegion(region._id)} className="btn-icon delete" title="Delete Region">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </PermissionGuard>
                            </div>

                            <div className="warehouses-list">
                                <h4>Warehouses</h4>
                                {region.warehouses && region.warehouses.length > 0 ? (
                                    <ul>
                                        {region.warehouses.map((wh) => (
                                            <li key={wh._id} className="warehouse-item">
                                                <span>{wh.name}</span>
                                                <div className="wh-actions">
                                                    <span className={`status-dot ${wh.active ? 'active' : 'inactive'}`}></span>
                                                    <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                                                        <button onClick={() => openWarehouseModal(region._id, wh)} className="btn-icon small" title="Edit Warehouse"><FiEdit2 size={14} /></button>
                                                        <button onClick={() => deleteWarehouse(wh._id)} className="btn-icon small delete" title="Delete Warehouse"><FiTrash2 size={14} /></button>
                                                    </PermissionGuard>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="empty-text">No warehouses</p>
                                )}

                                <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                                    <button
                                        onClick={() => openWarehouseModal(region._id)}
                                        className="btn btn-secondary btn-sm mt-md"
                                    >
                                        + Add Warehouse
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    ))}

                    {regions.length === 0 && <p>No regions defined.</p>}
                </div>
            )}

            {/* Region Modal */}
            {isRegionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingRegion ? 'Edit Region' : 'New Region'}</h2>
                            <button onClick={closeRegionModal} className="btn-close" title="Close"><FiX /></button>
                        </div>
                        <form onSubmit={handleRegionSubmit}>
                            <div className="form-group">
                                <label>Region Name</label>
                                <input
                                    value={regionForm.name}
                                    onChange={e => setRegionForm({ ...regionForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={regionForm.active}
                                        onChange={e => setRegionForm({ ...regionForm, active: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeRegionModal} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Warehouse Modal */}
            {isWarehouseModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}</h2>
                            <button onClick={closeWarehouseModal} className="btn-close" title="Close"><FiX /></button>
                        </div>
                        <form onSubmit={handleWarehouseSubmit}>
                            <div className="form-group">
                                <label>Warehouse Name</label>
                                <input
                                    value={warehouseForm.name}
                                    onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={warehouseForm.active}
                                        onChange={e => setWarehouseForm({ ...warehouseForm, active: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeWarehouseModal} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Locations;
