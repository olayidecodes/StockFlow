const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: { type: String, required: true },
            address: { type: String, required: true },
            phone: { type: String },
            email: { type: String },
        },
        region: {
            type: mongoose.Schema.ObjectId,
            ref: 'Region',
            required: true,
        },
        warehouse: {
            type: mongoose.Schema.ObjectId,
            ref: 'Warehouse',
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, // Stored in pieces
                },
                price: {
                    type: Number, // Optional for this task, but good practice
                }
            }
        ],
        status: {
            type: String,
            enum: ['DRAFT', 'PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED'],
            default: 'DRAFT',
        },
        totalAmount: {
            type: Number,
        },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        logs: [
            {
                status: String,
                changedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
                date: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying by status and warehouse
orderSchema.index({ warehouse: 1, status: 1 });

// Indexes for frequent queries (dashboard, list views)
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ status: 1 });     // Filter by status
orderSchema.index({ 'customer.name': 'text' }); // Search by customer

module.exports = mongoose.model('Order', orderSchema);
