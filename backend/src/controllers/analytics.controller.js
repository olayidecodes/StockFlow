const Order = require('../models/Order');
const InventoryBalance = require('../models/InventoryBalance');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private (Admin/Manager)
exports.getStats = async (req, res, next) => {
    try {
        const { days = 30, period = 'past30' } = req.query;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
        
        let trendStartDate;
        
        // Calculate date range based on period
        switch (period) {
            case 'today':
                trendStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                break;
                
            case 'thisWeek':
                // Start of current week (Sunday)
                const dayOfWeek = now.getDay();
                trendStartDate = new Date(now);
                trendStartDate.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
                trendStartDate.setHours(0, 0, 0, 0);
                break;
                
            case 'thisMonth':
                // Start of current month
                trendStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                break;
                
            case 'thisYear':
                // Start of current year
                trendStartDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                break;
                
            default:
                // For 'past7', 'past30', 'past365' or any numeric days
                const trendDays = parseInt(days);
                trendStartDate = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000);
                trendStartDate.setHours(0, 0, 0, 0);
        }
        
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // --- DASHBOARD V2 METRICS ---

        // 1. Top Selling Product (by quantity - single for card)
        const topProductByQtySingle = await Order.aggregate([
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

        // 2. Top Selling Product (by sales value - single for card)
        const topProductByValueSingle = await Order.aggregate([
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

        // 3. Top Selling Brand (single for card)
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
            // Add fields for safe calculation (avoid extensive frontend logic replication)
            {
                $addFields: {
                    // 1. Calculate volume from dimensions (dimensions are stored in meters, so m³ = length * breadth * height)
                    calculatedVolume: {
                        $multiply: [
                            { $ifNull: ['$productInfo.dimensions.length', 0] },
                            { $ifNull: ['$productInfo.dimensions.breadth', 0] },
                            { $ifNull: ['$productInfo.dimensions.height', 0] }
                        ]
                    },
                    // 2. Ensure carton size is valid for division
                    safeCartonSize: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$productInfo.cartonSize', 0] }, 0] },
                            then: '$productInfo.cartonSize',
                            else: 1
                        }
                    }
                }
            },
            {
                $addFields: {
                    // 3. Determine final unit volume (use stored volume if > 0, else calculated)
                    finalUnitVolume: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$productInfo.volume', 0] }, 0] },
                            then: '$productInfo.volume',
                            else: '$calculatedVolume'
                        }
                    },
                    // 4. Calculate number of cartons
                    numCartons: { $divide: ['$quantity', '$safeCartonSize'] }
                }
            },
            {
                $group: {
                    _id: '$warehouse',
                    totalCBM: { $sum: { $multiply: ['$numCartons', '$finalUnitVolume'] } },
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
                    // Match Inventory UI precision (Inventory shows CBM to 3dp)
                    value: { $round: ['$totalCBM', 3] },
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

        // 6. Top Customers (for Dashboard table)
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

        // --- LEGACY ANALYTICS PAGE METRICS ---

        // 7. Top Selling Products (Top 5 list for bar chart)
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

        // 8. Regional Performance (Order Count for pie chart)
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

        // 9. Stock Health / Financials
        const lowStockCount = await InventoryBalance.countDocuments({
            quantity: { $lt: 150 },
        });

        // Get low stock products with details
        const lowStockProducts = await InventoryBalance.aggregate([
            { $match: { quantity: { $lt: 150 } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'warehouses',
                    localField: 'warehouse',
                    foreignField: '_id',
                    as: 'warehouseInfo',
                },
            },
            { $unwind: { path: '$warehouseInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'productInfo.brand',
                    foreignField: '_id',
                    as: 'brandInfo',
                },
            },
            {
                $project: {
                    productName: { $ifNull: ['$productInfo.name', 'Unknown Product'] },
                    sku: { $ifNull: ['$productInfo.sku', 'N/A'] },
                    brand: { 
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$brandInfo', []] } }, 0] },
                            then: { $arrayElemAt: ['$brandInfo.name', 0] },
                            else: 'N/A'
                        }
                    },
                    warehouse: { $ifNull: ['$warehouseInfo.name', 'Unknown Warehouse'] },
                    quantity: 1,
                    reorderLevel: { $ifNull: ['$productInfo.reorderLevel', 150] }
                }
            },
            { $sort: { quantity: 1 } }
        ]);

        // Get aggregated low stock products (total across all warehouses)
        const aggregatedLowStock = await InventoryBalance.aggregate([
            {
                $group: {
                    _id: '$product',
                    totalQuantity: { $sum: '$quantity' }
                }
            },
            { $match: { totalQuantity: { $lt: 400 } } },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'productInfo.brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $project: {
                    productName: '$productInfo.name',
                    sku: '$productInfo.sku',
                    brand: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$brandInfo', []] } }, 0] },
                            then: { $arrayElemAt: ['$brandInfo.name', 0] },
                            else: 'N/A'
                        }
                    },
                    totalQuantity: 1
                }
            },
            { $sort: { totalQuantity: 1 } }
        ]);

        const inventorySummary = await InventoryBalance.aggregate([
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
                    _id: null,
                    totalQuantity: { $sum: '$quantity' },
                    totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$productInfo.wholesaleCost', '$productInfo.price'] }] } }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments({ status: { $ne: 'CANCELLED' } });
        const totalProducts = await Product.countDocuments();

        // 10. Burn Rate Analysis (Stock Movement Velocity)
        // Calculate sales velocity for last 30 days and compare with current stock
        const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const burnRateData = await Order.aggregate([
            { 
                $match: { 
                    status: { $ne: 'CANCELLED' },
                    createdAt: { $gte: thirtyDaysAgoDate }
                } 
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'productInfo.brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'inventorybalances',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'inventoryInfo'
                }
            },
            {
                $addFields: {
                    currentStock: {
                        $reduce: {
                            input: '$inventoryInfo',
                            initialValue: 0,
                            in: { $add: ['$$value', '$$this.quantity'] }
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Daily sales rate (units per day)
                    dailySalesRate: { $divide: ['$totalSold', 30] },
                    // Days until stock out (current stock / daily rate)
                    daysUntilStockout: {
                        $cond: {
                            if: { $gt: ['$totalSold', 0] },
                            then: { $divide: ['$currentStock', { $divide: ['$totalSold', 30] }] },
                            else: 999999 // No sales = infinite days
                        }
                    },
                    // Burn rate category
                    burnRateCategory: {
                        $cond: {
                            if: { $eq: ['$totalSold', 0] },
                            then: 'STAGNANT',
                            else: {
                                $cond: {
                                    if: { 
                                        $lte: [
                                            { $divide: ['$currentStock', { $divide: ['$totalSold', 30] }] },
                                            30
                                        ]
                                    },
                                    then: 'FAST',
                                    else: {
                                        $cond: {
                                            if: {
                                                $lte: [
                                                    { $divide: ['$currentStock', { $divide: ['$totalSold', 30] }] },
                                                    90
                                                ]
                                            },
                                            then: 'MODERATE',
                                            else: 'SLOW'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    productName: '$productInfo.name',
                    sku: '$productInfo.sku',
                    brand: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$brandInfo', []] } }, 0] },
                            then: { $arrayElemAt: ['$brandInfo.name', 0] },
                            else: 'N/A'
                        }
                    },
                    currentStock: 1,
                    totalSold: 1,
                    dailySalesRate: { $round: ['$dailySalesRate', 2] },
                    daysUntilStockout: { $round: ['$daysUntilStockout', 0] },
                    burnRateCategory: 1
                }
            },
            { $sort: { dailySalesRate: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalOrders,
                    totalProducts,
                    lowStock: lowStockCount,
                    topSellingBrand: topBrand[0]?.brand?.name || 'N/A',
                    topProductQty: topProductByQtySingle[0]?.product?.name || 'N/A',
                    topProductValue: topProductByValueSingle[0]?.product?.name || 'N/A',
                    totalQuantity: inventorySummary[0]?.totalQuantity || 0,
                    totalValue: inventorySummary[0]?.totalValue || 0,
                },
                topProducts,
                regionalPerformance,
                warehouseCBM,
                dispatchTrends,
                topCustomers,
                lowStockProducts,
                aggregatedLowStock,
                burnRateData
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
