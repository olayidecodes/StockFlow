const Order = require('../models/Order');
const InventoryBalance = require('../models/InventoryBalance');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private (Admin/Manager)
exports.getStats = async (req, res, next) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Top Selling Products (by quantity)
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            { $unwind: '$productInfo' },
            {
                $project: {
                    name: '$productInfo.name',
                    value: '$totalSold',
                },
            },
        ]);

        // 2. Regional Performance (Order Count)
        const regionalPerformance = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            {
                $group: {
                    _id: '$region',
                    value: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'regions',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'regionInfo',
                },
            },
            { $unwind: '$regionInfo' },
            {
                $project: {
                    name: '$regionInfo.name',
                    value: 1,
                },
            },
        ]);

        // 3. Dispatch Trends (Last 30 Days)
        const dispatchTrends = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $ne: 'CANCELLED' }
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: '$_id',
                    orders: 1,
                    _id: 0
                }
            }
        ]);

        // 4. Stock Health (Low Stock Count)
        // Assuming low stock is < 50 pieces (we could make this dynamic per product later)
        const lowStockCount = await InventoryBalance.countDocuments({
            quantity: { $lt: 50 },
            // We might want to filter active products only, but balance implies existence
        });

        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                topProducts,
                regionalPerformance,
                dispatchTrends,
                summary: {
                    lowStock: lowStockCount,
                    totalOrders,
                    totalProducts
                }
            },
        });
    } catch (error) {
        next(error);
    }
};
