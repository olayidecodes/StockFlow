const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Warehouse name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        region: {
            type: mongoose.Schema.ObjectId,
            ref: 'Region',
            required: [true, 'Region is required'],
        },
        active: {
            type: Boolean,
            default: true,
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

warehouseSchema.index({ region: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
