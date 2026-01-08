const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Brand', brandSchema);
