const Brand = require('../models/Brand');
const { validationResult } = require('express-validator');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private (Auth users)
exports.getBrands = async (req, res, next) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: brands.length,
            data: brands,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Private
exports.getBrand = async (req, res, next) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: `Brand not found with id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: brand,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private (Admin/Manager)
exports.createBrand = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const brand = await Brand.create(req.body);

        res.status(201).json({
            success: true,
            data: brand,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private (Admin/Manager)
exports.updateBrand = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        let brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: `Brand not found with id of ${req.params.id}`,
            });
        }

        brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: brand,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete brand (Soft delete or check dependencies first - keeping simple for now)
// @route   DELETE /api/brands/:id
// @access  Private (Admin only)
exports.deleteBrand = async (req, res, next) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: `Brand not found with id of ${req.params.id}`,
            });
        }

        await brand.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by brand
// @route   GET /api/brands/:id/products
// @access  Private
exports.getBrandProducts = async (req, res, next) => {
    try {
        const Product = require('../models/Product');
        
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: `Brand not found with id of ${req.params.id}`,
            });
        }

        const products = await Product.find({ brand: req.params.id })
            .populate('brand', 'name')
            .populate('category', 'name')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};
