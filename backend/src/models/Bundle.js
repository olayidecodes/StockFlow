const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Bundle name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    retailPrice: {
        type: Number,
        min: [0, 'Retail price cannot be negative'],
        default: null
    },
    priceHistory: [{
        previousPrice: { type: Number, default: null },
        newPrice: { type: Number, default: null },
        reason: { type: String, trim: true },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
bundleSchema.index({ name: 1 });
bundleSchema.index({ status: 1 });

module.exports = mongoose.model('Bundle', bundleSchema);
