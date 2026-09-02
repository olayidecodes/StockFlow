const mongoose = require('mongoose');

const sorCustomerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
        },
        email: {
            type: String,
        },
        notes: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'createdBy is required'],
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Text index on name + phone for search
sorCustomerSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('SORCustomer', sorCustomerSchema);
