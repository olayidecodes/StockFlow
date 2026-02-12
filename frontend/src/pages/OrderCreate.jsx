import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/Spinner';

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

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedProduct]);

    const filteredOptions = options.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClearSelection = () => {
        onChange('');
        setSelectedProduct(null);
        setSearchTerm('');
        setIsOpen(true);
    };

    return (
        <div className="search-select-container" ref={containerRef} style={{ position: 'relative' }}>
            <input
                type="text"
                className="search-select-input"
                placeholder={placeholder}
                value={searchTerm}
                onChange={e => {
                    if (!selectedProduct) {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }
                }}
                onFocus={() => {
                    if (!selectedProduct) {
                        setIsOpen(true);
                    }
                }}
                readOnly={!!selectedProduct}
                style={{ paddingRight: selectedProduct ? '35px' : '10px' }}
            />
            {selectedProduct && (
                <button
                    type="button"
                    onClick={handleClearSelection}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        fontSize: '18px',
                        padding: '0 5px',
                        lineHeight: '1'
                    }}
                    title="Change product"
                >
                    ×
                </button>
            )}
            {isOpen && !selectedProduct && (
                <div className="search-select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(p => (
                            <div
                                key={p._id}
                                className={`search-select-option ${p._id === value ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
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
        items: [], // { product, cartonQty, pieceQty, price }
        channel: 'Other',
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
            items: [], // Don't load items from template
            channel: 'Other',
        });
        setSelectedTemplate(templateId);
        toast.info(`Loaded template: ${template.name}`);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', cartonQty: 0, pieceQty: 0, price: 0 }]
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
        return formData.items.reduce((acc, item) => {
            const product = products.find(p => p._id === item.product);
            const cartonSize = product?.cartonSize || 1;
            const pieces = (item.cartonQty * cartonSize) + item.pieceQty;
            return acc + (pieces * item.price);
        }, 0);
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
                items: formData.items.map(item => {
                    if (item.cartonQty === 0 && item.pieceQty === 0) {
                        throw new Error('Each item must have a Carton or Piece quantity');
                    }
                    const product = products.find(p => p._id === item.product);
                    const cartonSize = product?.cartonSize || 1;
                    return {
                        product: item.product,
                        quantity: (item.cartonQty * cartonSize) + item.pieceQty,
                        price: item.price
                    };
                }),
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

            <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card mb-xl" style={{ marginBottom: '1rem' }}>
                    <h3 className="mb-lg border-bottom pb-sm">Customer Details</h3>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            value={formData.customer.name}
                            onChange={e => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Street Address</label>
                        <input
                            value={formData.customer.street}
                            onChange={e => setFormData({ ...formData, customer: { ...formData.customer, street: e.target.value } })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                value={formData.customer.city}
                                onChange={e => setFormData({ ...formData, customer: { ...formData.customer, city: e.target.value } })}
                                required
                            />
                        </div>
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
                </div>

                <div className="card mb-xl" style={{ marginBottom: '1rem' }}>
                    <h3 className="mb-lg border-bottom pb-sm">Fulfillment Center</h3>
                    <div className="form-row">
                        <div className="form-group">
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

                        <div className="form-group">
                            <label>Warehouse</label>
                            <select
                                value={formData.warehouse}
                                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                                required
                                disabled={!formData.region}
                            >
                                <option value="">Select Warehouse...</option>
                                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>How did the customer find us?</label>
                        <select
                            value={formData.channel}
                            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                            required
                        >
                            <option value="Instagram">Instagram</option>
                            <option value="Google">Google</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Referral">Referral</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="card mb-xl" style={{ marginBottom: '1rem' }}>
                    <h3>Order Items</h3>
                    {formData.warehouse ? (
                        <div className="items-context">
                            {formData.items.map((item, idx) => {
                                const available = inventory[item.product] || 0;
                                return (
                                    <div key={idx} className="item-row card-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                                        <div className="form-group flex-grow" style={{ flex: 2 }}>
                                            <label>Product</label>
                                            <ProductSearchSelect
                                                value={item.product}
                                                options={products}
                                                onChange={val => updateItem(idx, 'product', val)}
                                                placeholder="Search Product..."
                                            />
                                            {item.product && (() => {
                                                const product = products.find(p => p._id === item.product);
                                                const cartonSize = product?.cartonSize || 1;
                                                const availPieces = available;
                                                const availCartons = Math.floor(available / cartonSize);
                                                const remPieces = available % cartonSize;

                                                return (
                                                    <span className={`text-sm ${available === 0 ? 'text-error' : 'text-muted'}`}>
                                                        Available: {availPieces} pcs {cartonSize > 1 ? `(${availCartons} ctn, ${remPieces} pcs)` : ''}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        <div className="form-group" style={{ width: '100px' }}>
                                            <label>Cartons</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.cartonQty || ''}
                                                onChange={e => updateItem(idx, 'cartonQty', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="form-group" style={{ width: '100px' }}>
                                            <label>Pieces</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.pieceQty || ''}
                                                onChange={e => updateItem(idx, 'pieceQty', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="form-group" style={{ width: '100px' }}>
                                            <label>Price/Pc</label>
                                            <input
                                                type="number"
                                                value={item.price || ''}
                                                readOnly
                                                disabled
                                                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                        </div>

                                        <button type="button" onClick={() => removeItem(idx)} className="btn-icon delete" title="Remove Item" style={{ marginTop: '2rem' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                );
                            })}

                            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm mt-md">
                                <FiPlus /> Add Item
                            </button>

                            <div className="text-right mt-lg" style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                Total: ₦{calculateTotal().toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <div className="alert">Please select Region and Warehouse first.</div>
                    )}
                </div>

                <div className="card mb-xl">
                    <div className="template-save-box mb-lg">
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

                    <div className="text-right">
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem', marginTop: '1rem' }}>
                            {loading ? <Spinner size={20} color="#fff" /> : 'Create Order'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default OrderCreate;
