const mongoose = require('mongoose');

const reorderTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
        },
        customer: {
            name: { type: String, required: true },
            address: { type: String, required: true },
            phone: { type: String },
            email: { type: String },
        },
        region: {
            type: mongoose.Schema.ObjectId,
            ref: 'Region',
            required: true
        },
        warehouse: {
            type: mongoose.Schema.ObjectId,
            ref: 'Warehouse',
            required: true
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
                    min: 1,
                },
            },
        ],
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique template names per user
reorderTemplateSchema.index({ createdBy: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ReorderTemplate', reorderTemplateSchema);
