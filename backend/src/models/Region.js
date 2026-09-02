const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Region name is required'],
            unique: true,
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual populate for warehouses
regionSchema.virtual('warehouses', {
    ref: 'Warehouse',
    localField: '_id',
    foreignField: 'region',
    justOne: false,
});

module.exports = mongoose.model('Region', regionSchema);
