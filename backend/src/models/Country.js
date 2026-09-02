const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Country name is required'],
            unique: true,
            trim: true,
        },
        isoCode: {
            type: String,
            required: [true, 'ISO code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: [3, 'ISO code cannot be more than 3 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

countrySchema.index({ name: 1 });
countrySchema.index({ isoCode: 1 });

module.exports = mongoose.model('Country', countrySchema);
