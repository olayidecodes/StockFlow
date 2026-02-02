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

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private
exports.getCustomerAnalytics = async (req, res, next) => {
    try {
        const { recurring } = req.query;

        // Aggregate orders by customer
        const customerStats = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            {
                $group: {
                    _id: '$customer.name',
                    customerPhone: { $first: '$customer.phone' },
                    customerEmail: { $first: '$customer.email' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    lastOrderDate: { $max: '$createdAt' },
                    orderIds: { $push: '$_id' },
                },
            },
            { $sort: { totalOrders: -1 } },
        ]);

        // Filter for recurring customers if requested
        let filteredStats = customerStats;
        if (recurring === 'true') {
            filteredStats = customerStats.filter(c => c.totalOrders > 1);
        }

        // For each customer, get their most ordered products
        const customersWithProducts = await Promise.all(
            filteredStats.map(async (customer) => {
                const topProducts = await Order.aggregate([
                    { $match: { 'customer.name': customer._id, status: { $ne: 'CANCELLED' } } },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.product',
                            quantity: { $sum: '$items.quantity' },
                        },
                    },
                    { $sort: { quantity: -1 } },
                    { $limit: 3 },
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
                            sku: '$productInfo.sku',
                            quantity: 1,
                        },
                    },
                ]);

                return {
                    ...customer,
                    topProducts,
                    isRecurring: customer.totalOrders > 1,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: customersWithProducts.length,
            data: customersWithProducts,
        });
    } catch (error) {
        next(error);
    }
};
