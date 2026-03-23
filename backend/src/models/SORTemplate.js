const mongoose = require('mongoose');

const sorTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SORCustomer',
            required: [true, 'Customer is required'],
        },
        region: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region',
            required: [true, 'Region is required'],
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse is required'],
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: [true, 'Product is required'],
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is required'],
                    min: 1,
                },
            },
        ],
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

// Compound unique index: template names must be unique per customer
sorTemplateSchema.index({ customer: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SORTemplate', sorTemplateSchema);
