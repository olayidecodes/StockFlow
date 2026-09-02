const mongoose = require('mongoose');

const inventoryTransferSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true,
        },
        sourceWarehouse: {
            type: mongoose.Schema.ObjectId,
            ref: 'Warehouse',
            required: true,
        },
        destinationWarehouse: {
            type: mongoose.Schema.ObjectId,
            ref: 'Warehouse',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
            default: 'COMPLETED',
        },
        reason: {
            type: String,
            required: true,
        },
        initiatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        countryId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Country',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for queries
inventoryTransferSchema.index({ sourceWarehouse: 1, createdAt: -1 });
inventoryTransferSchema.index({ destinationWarehouse: 1, createdAt: -1 });
inventoryTransferSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransfer', inventoryTransferSchema);
