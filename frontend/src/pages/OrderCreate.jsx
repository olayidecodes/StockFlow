import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const OrderCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState({}); // productId -> { available }

    const [formData, setFormData] = useState({
        customer: { name: '', address: '', phone: '', email: '' },
        region: '',
        warehouse: '',
        items: [], // { product, quantity, price }
    });

    // Load Regions
    useEffect(() => {
        api.get('/regions').then(res => setRegions(res.data.data)).catch(console.error);
    }, []);

    // Load Warehouses when Region changes
    useEffect(() => {
        if (formData.region) {
            const region = regions.find(r => r._id === formData.region);
            setWarehouses(region ? region.warehouses : []);
        } else {
            setWarehouses([]);
        }
    }, [formData.region, regions]);

    // Load Products & Inventory when Warehouse changes
    useEffect(() => {
        if (formData.warehouse) {
            loadWarehouseData(formData.warehouse);
        } else {
            setProducts([]);
            setInventory({});
        }
    }, [formData.warehouse]);

    const loadWarehouseData = async (warehouseId) => {
        try {
            const [prodRes, invRes] = await Promise.all([
                api.get('/products'),
                api.get(`/inventory/balance?warehouseId=${warehouseId}`)
            ]);
            setProducts(prodRes.data.data.filter(p => p.status === 'ACTIVE'));

            const invMap = {};
            invRes.data.data.forEach(item => {
                invMap[item.product._id] = item.available; // Use 'available' (quantity - allocated)
            });
            setInventory(invMap);

        } catch (err) {
            console.error('Failed to load warehouse data', err);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', quantity: 1, price: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Auto-set mock price (optional)
        if (field === 'product') {
            // In a real app we'd fetch price. Here just mock 100.
            newItems[index].price = 100;
        }

        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) return alert('Add at least one item');

        setLoading(true);
        try {
            await api.post('/orders', formData);
            navigate('/orders');
        } catch (err) {
            alert(err.response?.data?.errors?.[0]?.msg || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>New Order</h1>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-grid">
                {/* Left Column: Customer & Location */}
                <div className="dashboard-card main-col">
                    <h3>Customer Details</h3>
                    <div className="form-group mb-md">
                        <label>Name</label>
                        <input
                            value={formData.customer.name}
                            onChange={e => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })}
                            required
                        />
                    </div>
                    <div className="form-group mb-md">
                        <label>Address</label>
                        <input
                            value={formData.customer.address}
                            onChange={e => setFormData({ ...formData, customer: { ...formData.customer, address: e.target.value } })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.customer.email}
                                onChange={e => setFormData({ ...formData, customer: { ...formData.customer, email: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                value={formData.customer.phone}
                                onChange={e => setFormData({ ...formData, customer: { ...formData.customer, phone: e.target.value } })}
                            />
                        </div>
                    </div>

                    <h3 className="mt-xl">Order Items</h3>
                    {formData.warehouse ? (
                        <div className="items-context">
                            {formData.items.map((item, idx) => {
                                const available = inventory[item.product] || 0;
                                const isStockLow = available < item.quantity;

                                return (
                                    <div key={idx} className="item-row card-row">
                                        <div className="form-group flex-grow">
                                            <label>Product</label>
                                            <select
                                                value={item.product}
                                                onChange={e => updateItem(idx, 'product', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Product...</option>
                                                {products.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name} ({p.sku})
                                                    </option>
                                                ))}
                                            </select>
                                            {item.product && (
                                                <span className={`text-sm ${available === 0 ? 'text-error' : 'text-muted'}`}>
                                                    Available: {available} pieces
                                                </span>
                                            )}
                                        </div>

                                        <div className="form-group w-100">
                                            <label>Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                                required
                                            />
                                        </div>

                                        <div className="form-group w-100">
                                            <label>Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))}
                                            />
                                        </div>

                                        <button type="button" onClick={() => removeItem(idx)} className="btn-icon delete mt-md">
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}

                            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm mt-md">
                                + Add Item
                            </button>

                            <div className="text-right mt-lg">
                                <h3>Total: ${calculateTotal().toLocaleString()}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="alert">Please select Region and Warehouse first.</div>
                    )}
                </div>

                {/* Right Column: Settings */}
                <div className="dashboard-card sidebar-col h-fit">
                    <h3>Fulfillment Center</h3>
                    <div className="form-group mb-md">
                        <label>Region</label>
                        <select
                            value={formData.region}
                            onChange={e => setFormData({ ...formData, region: e.target.value, warehouse: '' })}
                            required
                        >
                            <option value="">Select Region...</option>
                            {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group mb-xl">
                        <label>Warehouse</label>
                        <select
                            value={formData.warehouse}
                            onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                            required
                            disabled={!formData.region}
                        >
                            <option value="">Select Warehouse...</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Order'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrderCreate;
