const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null/undefined values
            trim: true,
            uppercase: true,
            maxlength: [20, 'SKU cannot be more than 20 characters'],
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        brand: {
            type: mongoose.Schema.ObjectId,
            ref: 'Brand',
            required: [true, 'Brand is required'],
        },
        cartonSize: {
            type: Number,
            required: [true, 'Carton size is required'],
            min: [1, 'Carton size must be at least 1'],
        },
        dimensions: {
            length: { type: Number, default: 0 },
            breadth: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            unit: { type: String, default: 'm' }
        },
        volume: {
            type: Number, // Calculated (L * B * H)
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0
        },
        weight: {
            type: Number,
            min: [0, 'Weight cannot be negative'],
            default: 0,
            // Weight per piece in kg
        },
        wholesaleCost: {
            type: Number,
            min: [0, 'Wholesale cost cannot be negative'],
            default: 0,
            // Cost per piece
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index if we frequently search by brand and status
productSchema.index({ brand: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
