// const mongoose = require('mongoose');
// const path = require('path');

// // Load environment variables from the correct path
// require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// // Import models after dotenv is configured
// const Order = require('../models/Order');
// const Counter = require('../models/Counter');

// /**
//  * Script to reset the order counter to match actual order count
//  * This fixes the issue where counter gets incremented on failed order attempts
//  */
// async function resetOrderCounter() {
//     try {
//         // Check if MONGO_URI is loaded
//         if (!process.env.MONGO_URI) {
//             throw new Error('MONGO_URI not found in environment variables. Please check your .env file.');
//         }

//         // Connect to MongoDB
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log('✅ Connected to MongoDB');

//         // Count existing orders
//         const orderCount = await Order.countDocuments();
//         console.log(`📊 Found ${orderCount} existing orders in database`);

//         // Update the counter to match
//         await Counter.findByIdAndUpdate(
//             'orderId',
//             { seq: orderCount },
//             { upsert: true }
//         );

//         console.log(`✅ Counter reset to ${orderCount}`);
//         console.log(`🎯 Next order will be #${orderCount + 1}`);

//         await mongoose.connection.close();
//         console.log('✅ Database connection closed');
        
//         process.exit(0);
//     } catch (error) {
//         console.error('❌ Error resetting counter:', error.message);
//         if (mongoose.connection.readyState === 1) {
//             await mongoose.connection.close();
//         }
//         process.exit(1);
//     }
// }

// resetOrderCounter();
