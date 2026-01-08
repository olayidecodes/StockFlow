const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
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
