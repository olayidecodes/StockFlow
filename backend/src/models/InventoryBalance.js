const mongoose = require('mongoose');

const inventoryBalanceSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true,
        },
        warehouse: {
            type: mongoose.Schema.ObjectId,
            ref: 'Warehouse',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            // Total physical quantity in pieces
        },
        allocated: {
            type: Number,
            required: true,
            default: 0,
            // Quantity reserved for Confirmed orders
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for available quantity
inventoryBalanceSchema.virtual('available').get(function () {
    return this.quantity - this.allocated;
});

// Ensure unique combination of product+warehouse
inventoryBalanceSchema.index({ warehouse: 1, product: 1 }, { unique: true });

// Compound index for fast lookup of specific product at specific warehouse
inventoryBalanceSchema.index({ warehouse: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('InventoryBalance', inventoryBalanceSchema);
