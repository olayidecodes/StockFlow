require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

const migrateOrderType = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Update all orders without orderType to have RETAIL as default
        const result = await Order.updateMany(
            { orderType: { $exists: false } },
            { $set: { orderType: 'RETAIL', deliveryFee: 0 } }
        );

        console.log(`Migration completed: ${result.modifiedCount} orders updated`);
        
        // Also update orders with null orderType
        const result2 = await Order.updateMany(
            { orderType: null },
            { $set: { orderType: 'RETAIL' } }
        );
        
        console.log(`Additional migration: ${result2.modifiedCount} orders with null orderType updated`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateOrderType();
