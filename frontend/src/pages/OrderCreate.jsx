import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const ProductSearchSelect = ({ value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const containerRef = useRef(null);

    // Sync state with value prop
    useEffect(() => {
        if (value) {
            const prod = options.find(p => p._id === value);
            setSelectedProduct(prod);
            setSearchTerm(prod ? `${prod.name} (${prod.sku})` : '');
        } else {
            setSelectedProduct(null);
            setSearchTerm('');
        }
    }, [value, options]);

    // Handle clicks outside to close dropdown and reset search term
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset search term to current selection if user blurs without picking
                if (selectedProduct) {
                    setSearchTerm(`${selectedProduct.name} (${selectedProduct.sku})`);
                } else {
                    setSearchTerm('');
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, selectedProduct]);

    const filteredOptions = options.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="search-select-container">
            <input
                type="text"
                className="search-select-input"
                placeholder={placeholder}
                value={searchTerm}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                    // Timeout to allow clicking an option before it vanishes
                    setTimeout(() => setIsOpen(false), 200);
                }}
            />
            {isOpen && (
                <div className="search-select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(p => (
                            <div
                                key={p._id}
                                className={`search-select-option ${p._id === value ? 'active' : ''}`}
                                onClick={() => {
                                    onChange(p._id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="p-name">{p.name}</span>
                                <span className="p-sku">{p.sku}</span>
                            </div>
                        ))
                    ) : (
                        <div className="search-select-no-results">No products found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const OrderCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState({}); // productId -> { available }
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const [formData, setFormData] = useState({
        customer: { name: '', street: '', city: '', state: '', zip: '', phone: '', email: '' },
        region: '',
        warehouse: '',
        items: [], // { product, quantity, price }
    });

    // Load Regions and Templates
    useEffect(() => {
        api.get('/regions').then(res => setRegions(res.data.data)).catch(console.error);
        api.get('/templates').then(res => setTemplates(res.data.data)).catch(console.error);
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
                if (item.product && item.product._id) {
                    invMap[item.product._id] = item.available;
                }
            });
            setInventory(invMap);

        } catch (err) {
            console.error('Failed to load warehouse data', err);
        }
    };

    const handleLoadTemplate = (templateId) => {
        const template = templates.find(t => t._id === templateId);
        if (!template) return;

        // Try to parse the address if it was combined
        let street = template.customer.address;
        let city = '', state = '', zip = '';

        const parts = template.customer.address.split(', ');
        if (parts.length >= 3) {
            street = parts[0];
            city = parts[1];
            const stateZip = parts[2].split(' ');
            state = stateZip[0] || '';
            zip = stateZip[1] || '';
        }

        setFormData({
            customer: {
                name: template.customer.name,
                street: street,
                city: city,
                state: state,
                zip: zip,
                phone: template.customer.phone || '',
                email: template.customer.email || '',
            },
            region: template.region?._id || template.region,
            warehouse: template.warehouse?._id || template.warehouse,
            items: [] // Don't load items from template
        });
        setSelectedTemplate(templateId);
        toast.info(`Loaded template: ${template.name}`);
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

        if (field === 'product') {
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index].price = product.price || 0;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) return toast.error('Add at least one item');

        setLoading(true);
        try {
            const combinedAddress = `${formData.customer.street}, ${formData.customer.city}, ${formData.customer.state} ${formData.customer.zip}`;
            const customerData = {
                ...formData.customer,
                address: combinedAddress
            };

            // Save Template if requested
            if (saveAsTemplate) {
                if (!templateName) throw new Error('Please provide a template name');
                await api.post('/templates', {
                    name: templateName,
                    customer: customerData,
                    region: formData.region,
                    warehouse: formData.warehouse,
                    items: [] // Don't save items in template
                });
                toast.success('Template saved successfully');
            }

            const payload = {
                ...formData,
                customer: customerData
            };
            await api.post('/orders', payload);
            toast.success('Order created successfully');
            navigate('/orders');
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>New Order</h1>
                <div className="template-selector">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => handleLoadTemplate(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Quick Load Template...</option>
                        {templates.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                </div>
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
                        <label>Street Address</label>
                        <input
                            value={formData.customer.street}
                            onChange={e => setFormData({ ...formData, customer: { ...formData.customer, street: e.target.value } })}
                            required
                        />
                    </div>

                    <div className="form-row mb-md">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                value={formData.customer.city}
                                onChange={e => setFormData({ ...formData, customer: { ...formData.customer, city: e.target.value } })}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>State/Province</label>
                                <input
                                    value={formData.customer.state}
                                    onChange={e => setFormData({ ...formData, customer: { ...formData.customer, state: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input
                                    value={formData.customer.zip}
                                    onChange={e => setFormData({ ...formData, customer: { ...formData.customer, zip: e.target.value } })}
                                    required
                                />
                            </div>
                        </div>
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
                                            <ProductSearchSelect
                                                value={item.product}
                                                options={products}
                                                onChange={val => updateItem(idx, 'product', val)}
                                                placeholder="Search Product..."
                                            />
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
                                                value={item.price}
                                                readOnly
                                                disabled
                                                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                        </div>

                                        <button type="button" onClick={() => removeItem(idx)} className="btn-icon delete mt-md">
                                            Delete
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

                    <div className="template-save-box mt-xl mb-lg">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="saveAsTemplate"
                                checked={saveAsTemplate}
                                onChange={e => setSaveAsTemplate(e.target.checked)}
                            />
                            <label htmlFor="saveAsTemplate">Save as template for future use</label>
                        </div>
                        {saveAsTemplate && (
                            <div className="form-group mt-sm">
                                <label>Template Name</label>
                                <input
                                    placeholder="e.g. Regular Order - Smith"
                                    value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
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
