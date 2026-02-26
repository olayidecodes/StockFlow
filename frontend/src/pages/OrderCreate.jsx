import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiPackage, FiBox } from 'react-icons/fi';
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

const BundleSearchSelect = ({ value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBundle, setSelectedBundle] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            const bundle = options.find(b => b._id === value);
            setSelectedBundle(bundle);
            setSearchTerm(bundle ? bundle.name : '');
        } else {
            setSelectedBundle(null);
            setSearchTerm('');
        }
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                if (selectedBundle) {
                    setSearchTerm(selectedBundle.name);
                } else {
                    setSearchTerm('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedBundle]);

    const filteredOptions = options.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClearSelection = () => {
        onChange('');
        setSelectedBundle(null);
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
                    if (!selectedBundle) {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }
                }}
                onFocus={() => {
                    if (!selectedBundle) setIsOpen(true);
                }}
                readOnly={!!selectedBundle}
                style={{ paddingRight: selectedBundle ? '35px' : '10px' }}
            />
            {selectedBundle && (
                <button
                    type="button"
                    onClick={handleClearSelection}
                    style={{
                        position: 'absolute', right: '8px', top: '50%',
                        transform: 'translateY(-50%)', background: 'transparent',
                        border: 'none', cursor: 'pointer', color: '#666',
                        fontSize: '18px', padding: '0 5px', lineHeight: '1'
                    }}
                    title="Change bundle"
                >
                    ×
                </button>
            )}
            {isOpen && !selectedBundle && (
                <div className="search-select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(b => (
                            <div
                                key={b._id}
                                className={`search-select-option ${b._id === value ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(b._id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="p-name">{b.name}</span>
                                <span className="p-sku" style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {b.products.length} product{b.products.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="search-select-no-results">No bundles found</div>
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
    const [bundles, setBundles] = useState([]);
    const [inventory, setInventory] = useState({}); // productId -> { available }
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [orderType, setOrderType] = useState('RETAIL'); // RETAIL or WHOLESALE

    const [formData, setFormData] = useState({
        customer: { name: '', street: '', city: '', state: '', zip: '', phone: '', email: '' },
        region: '',
        warehouse: '',
        items: [], // { type: 'PRODUCT'|'BUNDLE', product/bundle, cartonQty, pieceQty, bundleQty, price }
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
            setBundles([]);
            setInventory({});
        }
    }, [formData.warehouse]);

    const loadWarehouseData = async (warehouseId) => {
        try {
            const [prodRes, invRes, bundleRes] = await Promise.all([
                api.get('/products?limit=1000'),
                api.get(`/inventory/balance?warehouseId=${warehouseId}`),
                api.get('/bundles?status=ACTIVE')
            ]);
            setProducts(prodRes.data.data.filter(p => p.status === 'ACTIVE'));
            setBundles(bundleRes.data.data);

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
            items: [...formData.items, { type: 'PRODUCT', product: '', bundle: '', cartonQty: 0, pieceQty: 0, bundleQty: 0, price: 0 }]
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

        // When type changes, reset relevant fields
        if (field === 'type') {
            if (value === 'PRODUCT') {
                newItems[index].bundle = '';
                newItems[index].bundleQty = 0;
            } else if (value === 'BUNDLE') {
                newItems[index].product = '';
                newItems[index].cartonQty = 0;
                newItems[index].pieceQty = 0;
            }
        }

        // When product is selected
        if (field === 'product') {
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index].price = orderType === 'WHOLESALE'
                    ? (product.wholesaleCost || 0)
                    : (product.price || 0);
            }
        }

        // When bundle is selected
        if (field === 'bundle') {
            const bundle = bundles.find(b => b._id === value);
            if (bundle) {
                // Calculate bundle price based on order type
                const bundlePrice = bundle.products.reduce((sum, item) => {
                    const price = orderType === 'WHOLESALE'
                        ? (item.product?.wholesaleCost || 0)
                        : (item.product?.price || 0);
                    return sum + (item.quantity * price);
                }, 0);
                newItems[index].price = bundlePrice;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    // Update all item prices when order type changes
    const handleOrderTypeChange = (newOrderType) => {
        setOrderType(newOrderType);

        // Update prices for all existing items
        const updatedItems = formData.items.map(item => {
            const product = products.find(p => p._id === item.product);
            if (product) {
                return {
                    ...item,
                    price: newOrderType === 'WHOLESALE'
                        ? (product.wholesaleCost || 0)
                        : (product.price || 0)
                };
            }
            return item;
        });

        setFormData({ ...formData, items: updatedItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => {
            if (item.type === 'BUNDLE') {
                const bundle = bundles.find(b => b._id === item.bundle);
                if (!bundle) return acc;
                const bundleUnitPrice = bundle.products.reduce((sum, bp) => {
                    const price = orderType === 'WHOLESALE'
                        ? (bp.product?.wholesaleCost || 0)
                        : (bp.product?.price || 0);
                    return sum + (bp.quantity * price);
                }, 0);
                return acc + (item.bundleQty * bundleUnitPrice);
            } else {
                const product = products.find(p => p._id === item.product);
                const cartonSize = product?.cartonSize || 1;
                const pieces = (item.cartonQty * cartonSize) + item.pieceQty;
                return acc + (pieces * item.price);
            }
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) return toast.error('Add at least one item');

        setLoading(true);
        try {
            const combinedAddress = formData.customer.zip
                ? `${formData.customer.street}, ${formData.customer.city}, ${formData.customer.state} ${formData.customer.zip}`
                : `${formData.customer.street}, ${formData.customer.city}, ${formData.customer.state}`;
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

            // Expand all items (bundles get expanded into constituent product items)
            const expandedItems = [];
            for (const item of formData.items) {
                if (item.type === 'BUNDLE') {
                    const bundle = bundles.find(b => b._id === item.bundle);
                    if (!bundle) throw new Error('Please select a bundle for each bundle item');
                    if (!item.bundleQty || item.bundleQty < 1) throw new Error('Each bundle item must have at least 1 unit');
                    for (const bp of bundle.products) {
                        const productPrice = orderType === 'WHOLESALE'
                            ? (bp.product?.wholesaleCost || 0)
                            : (bp.product?.price || 0);
                        expandedItems.push({
                            product: bp.product._id,
                            quantity: item.bundleQty * bp.quantity,
                            price: productPrice
                        });
                    }
                } else {
                    if (item.cartonQty === 0 && item.pieceQty === 0) {
                        throw new Error('Each product item must have a Carton or Piece quantity');
                    }
                    const product = products.find(p => p._id === item.product);
                    const cartonSize = product?.cartonSize || 1;
                    expandedItems.push({
                        product: item.product,
                        quantity: (item.cartonQty * cartonSize) + item.pieceQty,
                        price: item.price
                    });
                }
            }

            const payload = {
                ...formData,
                items: expandedItems,
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
                            <option key={t._id} value={t._id}>
                                {t.name}
                                {t.createdBy?.name && ` (by ${t.createdBy.name})`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Order Type Selector - Responsive */}
            <div style={{
                background: '#F7FAFC',
                padding: '16px 24px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '16px',
                maxWidth: '1200px',
                margin: '0 auto 20px auto'
            }}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#2D3748',
                    minWidth: 'fit-content'
                }}>
                    Order Type:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => handleOrderTypeChange('RETAIL')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '6px',
                            border: orderType === 'RETAIL' ? '2px solid #4880FF' : '1px solid #CBD5E0',
                            background: orderType === 'RETAIL' ? '#4880FF' : 'white',
                            color: orderType === 'RETAIL' ? 'white' : '#4A5568',
                            fontWeight: orderType === 'RETAIL' ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            minWidth: '140px',
                            textAlign: 'center',
                            boxSizing: 'border-box'
                        }}
                    >
                        Retail Price
                    </button>
                    <button
                        type="button"
                        onClick={() => handleOrderTypeChange('WHOLESALE')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '6px',
                            border: orderType === 'WHOLESALE' ? '2px solid #4880FF' : '1px solid #CBD5E0',
                            background: orderType === 'WHOLESALE' ? '#4880FF' : 'white',
                            color: orderType === 'WHOLESALE' ? 'white' : '#4A5568',
                            fontWeight: orderType === 'WHOLESALE' ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            minWidth: '140px',
                            textAlign: 'center',
                            boxSizing: 'border-box'
                        }}
                    >
                        Wholesale Price
                    </button>
                </div>
                <span style={{
                    fontSize: '12px',
                    color: '#718096',
                    marginLeft: 'auto',
                    minWidth: 'fit-content'
                }}>
                    {orderType === 'RETAIL' ? 'Using retail prices' : 'Using wholesale prices'}
                </span>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .page-container > div:nth-child(2) {
                        padding: 12px 16px !important;
                    }
                    .page-container > div:nth-child(2) > span:first-child {
                        width: 100%;
                        margin-bottom: 4px;
                    }
                    .page-container > div:nth-child(2) > div {
                        width: 100%;
                        justify-content: center;
                    }
                    .page-container > div:nth-child(2) > span:last-child {
                        width: 100%;
                        text-align: center;
                        margin-left: 0 !important;
                        margin-top: 4px;
                    }
                }
                @media (max-width: 480px) {
                    .page-container > div:nth-child(2) > div button {
                        flex: 1;
                        min-width: 120px;
                    }
                }
            `}</style>

            <form onSubmit={handleSubmit} style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
                            <label>Zip Code (Optional)</label>
                            <input
                                value={formData.customer.zip}
                                onChange={e => setFormData({ ...formData, customer: { ...formData.customer, zip: e.target.value } })}
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
                                const selectedBundle = item.type === 'BUNDLE' ? bundles.find(b => b._id === item.bundle) : null;
                                return (
                                    <div key={idx} className="item-row card-row" style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                                        {/* Type Toggle */}
                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => updateItem(idx, 'type', 'PRODUCT')}
                                                style={{
                                                    padding: '4px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                                                    border: item.type === 'PRODUCT' ? '2px solid #4880FF' : '1px solid #CBD5E0',
                                                    background: item.type === 'PRODUCT' ? '#EBF2FF' : 'white',
                                                    color: item.type === 'PRODUCT' ? '#4880FF' : '#718096',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <FiBox size={12} /> Product
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateItem(idx, 'type', 'BUNDLE')}
                                                style={{
                                                    padding: '4px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                                                    border: item.type === 'BUNDLE' ? '2px solid #8B5CF6' : '1px solid #CBD5E0',
                                                    background: item.type === 'BUNDLE' ? '#F3EEFF' : 'white',
                                                    color: item.type === 'BUNDLE' ? '#8B5CF6' : '#718096',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <FiPackage size={12} /> Bundle
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            {item.type === 'BUNDLE' ? (
                                                /* ---- Bundle Row ---- */
                                                <>
                                                    <div className="form-group flex-grow" style={{ flex: 2 }}>
                                                        <label>Bundle</label>
                                                        <BundleSearchSelect
                                                            value={item.bundle}
                                                            options={bundles}
                                                            onChange={val => updateItem(idx, 'bundle', val)}
                                                            placeholder="Search Bundle..."
                                                        />
                                                        {selectedBundle && (
                                                            <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748B', lineHeight: '1.5' }}>
                                                                {selectedBundle.products.map((bp, i) => (
                                                                    <span key={i}>
                                                                        {bp.quantity}× {bp.product?.name}{i < selectedBundle.products.length - 1 ? ', ' : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="form-group" style={{ width: '100px' }}>
                                                        <label>Units</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.bundleQty || ''}
                                                            onChange={e => updateItem(idx, 'bundleQty', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>

                                                    <div className="form-group" style={{ width: '120px' }}>
                                                        <label>
                                                            Line Total
                                                            <span style={{ fontSize: '10px', color: '#8B5CF6', marginLeft: '4px', fontWeight: 600 }}>Bundle</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedBundle ? `₦${(
                                                                item.bundleQty * selectedBundle.products.reduce((sum, bp) => {
                                                                    const price = orderType === 'WHOLESALE' ? (bp.product?.wholesaleCost || 0) : (bp.product?.price || 0);
                                                                    return sum + (bp.quantity * price);
                                                                }, 0)
                                                            ).toLocaleString()}` : '₦0'}
                                                            readOnly
                                                            disabled
                                                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                /* ---- Product Row (unchanged) ---- */
                                                <>
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
                                                        <label>
                                                            Price/Pc
                                                            <span style={{
                                                                fontSize: '10px',
                                                                color: orderType === 'WHOLESALE' ? '#10b981' : '#4880FF',
                                                                marginLeft: '4px',
                                                                fontWeight: 600
                                                            }}>
                                                                ({orderType === 'WHOLESALE' ? 'W' : 'R'})
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.price || ''}
                                                            readOnly
                                                            disabled
                                                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <button type="button" onClick={() => removeItem(idx)} className="btn-icon delete" title="Remove Item" style={{ marginTop: '2rem' }}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
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
