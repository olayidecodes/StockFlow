require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/test.routes');
const brandRoutes = require('./routes/brand.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const regionRoutes = require('./routes/region.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const orderRoutes = require('./routes/order.routes');
const templateRoutes = require('./routes/template.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const financialsRoutes = require('./routes/financials.routes');
const bundleRoutes = require('./routes/bundle.routes');
const whatsappService = require('./services/whatsapp.service');
const sorCustomerRoutes = require('./routes/sor.customer.routes');
const sorTemplateRoutes = require('./routes/sor.template.routes');
const sorOrderRoutes = require('./routes/sor.order.routes');
const sorPaymentRoutes = require('./routes/sor.payment.routes');
const sorDashboardRoutes = require('./routes/sor.dashboard.routes');

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/financials', financialsRoutes);
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/sor/customers', sorCustomerRoutes);
app.use('/api/sor/templates', sorTemplateRoutes);
app.use('/api/sor/orders', sorOrderRoutes);
app.use('/api/sor/payments', sorPaymentRoutes);
app.use('/api/sor/dashboard', sorDashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'StockFlow API is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

    // Initialize WhatsApp Service
    whatsappService.initialize();
});
