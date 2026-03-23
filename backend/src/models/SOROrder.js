const mongoose = require('mongoose');

const sorOrderSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SORCustomer',
            required: [true, 'Customer is required'],
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Order is required'],
            unique: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'createdBy is required'],
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient lookup by customer
sorOrderSchema.index({ customer: 1 });

module.exports = mongoose.model('SOROrder', sorOrderSchema);
