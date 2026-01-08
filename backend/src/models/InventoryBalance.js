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
            // Always stored in pieces
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique combination of product+warehouse
inventoryBalanceSchema.index({ warehouse: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('InventoryBalance', inventoryBalanceSchema);
