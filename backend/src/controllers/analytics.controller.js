const Order = require('../models/Order');
const InventoryBalance = require('../models/InventoryBalance');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private (Admin/Manager)
exports.getStats = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const trendDays = parseInt(days);
        const today = new Date();
        const trendStartDate = new Date(today.getTime() - trendDays * 24 * 60 * 60 * 1000);

        // 1. Top Selling Product (by quantity)
        const topProductByQty = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' }
        ]);

        // 2. Top Selling Product (by sales value)
        const topProductByValue = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalValue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                },
            },
            { $sort: { totalValue: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' }
        ]);

        // 3. Top Selling Brand
        const topBrand = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.brand',
                    totalSold: { $sum: '$items.quantity' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brand',
                },
            },
            { $unwind: '$brand' }
        ]);

        // 4. Warehouse Volume (CBM)
        const warehouseCBM = await InventoryBalance.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: '$warehouse',
                    totalCBM: { $sum: { $multiply: ['$quantity', { $ifNull: ['$productInfo.volume', 0] }] } },
                },
            },
            {
                $lookup: {
                    from: 'warehouses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'warehouseInfo',
                },
            },
            { $unwind: '$warehouseInfo' },
            {
                $project: {
                    name: '$warehouseInfo.name',
                    value: { $round: ['$totalCBM', 2] },
                },
            },
        ]);

        // 5. Dispatch Trends
        const dispatchTrends = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: trendStartDate },
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

        // 6. Top Customers
        const topCustomers = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            {
                $group: {
                    _id: '$customer.name',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                    lastOrder: { $max: '$createdAt' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 }
        ]);

        const totalOrders = await Order.countDocuments({ status: { $ne: 'CANCELLED' } });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalOrders,
                    topSellingBrand: topBrand[0]?.brand?.name || 'N/A',
                    topProductQty: topProductByQty[0]?.product?.name || 'N/A',
                    topProductValue: topProductByValue[0]?.product?.name || 'N/A',
                },
                warehouseCBM,
                dispatchTrends,
                topCustomers
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
