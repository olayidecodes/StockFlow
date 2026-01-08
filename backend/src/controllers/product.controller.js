const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Auth users)
exports.getProducts = async (req, res, next) => {
    try {
        let query;

        // Filter by brand if provided
        if (req.query.brandId) {
            query = Product.find({ brand: req.query.brandId });
        } else {
            query = Product.find();
        }

        // Populate brand details
        query = query.populate({
            path: 'brand',
            select: 'name active',
        });

        const products = await query;

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('brand');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Manager)
exports.createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager)
exports.updateProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        // Check if carton size is being changed
        if (req.body.cartonSize && req.body.cartonSize !== product.cartonSize) {
            // TODO: Check if orders exist for this product
            // If orders exist, return 400 error
            // const ordersExist = await Order.countDocuments({ 'items.product': req.params.id });
            // if (ordersExist > 0) { ... }

            // For now, allow change as no orders system yet
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: updatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        // TODO: Check for dependencies (stock, orders) before deleting

        await product.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
