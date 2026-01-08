const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
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
        change: {
            type: Number,
            required: true,
            // Change in pieces. Positive for IN, Negative for OUT.
        },
        type: {
            type: String,
            enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'],
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
            // E.g., Order ID, Transfer ID, or manual note
        },
        balanceAfter: {
            type: Number,
            // Snapshot of balance at this point in time (pieces)
        },
        performedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true, // createdAt is the transaction time
    }
);

// Indexes for fast lookup of history
stockLedgerSchema.index({ warehouse: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
