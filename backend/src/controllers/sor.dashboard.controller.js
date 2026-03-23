const SORCustomer = require('../models/SORCustomer');
const SOROrder = require('../models/SOROrder');
const SORPayment = require('../models/SORPayment');
const { computeLiability } = require('../services/sor.paymentTracker.service');

// @desc    Get SOR dashboard summary
// @route   GET /api/sor/dashboard
// @access  Staff
exports.getDashboard = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // 1. Get all SOR customers
        const customers = await SORCustomer.find().lean();

        // 2. Compute liability for each customer
        const customersWithLiability = await Promise.all(
            customers.map(async (customer) => {
                const { outstandingLiability } = await computeLiability(customer._id);
                return {
                    _id: customer._id,
                    name: customer.name,
                    phone: customer.phone,
                    outstandingLiability,
                };
            })
        );

        // 3. Active customers = those with outstandingLiability > 0
        const activeCustomers = customersWithLiability.filter(c => c.outstandingLiability > 0);

        // 4. Total liability = sum of all outstanding liabilities
        const totalLiability = customersWithLiability.reduce(
            (sum, c) => sum + c.outstandingLiability,
            0
        );

        // 5. Payments in date range
        const paymentQuery = {};
        if (startDate || endDate) {
            paymentQuery.paymentDate = {};
            if (startDate) paymentQuery.paymentDate.$gte = new Date(startDate);
            if (endDate) paymentQuery.paymentDate.$lte = new Date(endDate);
        }

        const paymentsInRange = await SORPayment.aggregate([
            { $match: paymentQuery },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalPaymentsInRange = paymentsInRange[0]?.total ?? 0;

        // 6. Ranked customer list — sorted by outstandingLiability descending
        const rankedCustomers = [...customersWithLiability].sort(
            (a, b) => b.outstandingLiability - a.outstandingLiability
        );

        // 7. Overdue orders — CONFIRMED SOR orders created more than 30 days ago
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const overdueOrders = await SOROrder.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: 'orderDoc',
                },
            },
            { $unwind: '$orderDoc' },
            {
                $match: {
                    'orderDoc.status': 'CONFIRMED',
                    'orderDoc.createdAt': { $lt: thirtyDaysAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalValue: { $sum: '$orderDoc.totalAmount' },
                },
            },
        ]);

        const overdueCount = overdueOrders[0]?.count ?? 0;
        const overdueTotalValue = overdueOrders[0]?.totalValue ?? 0;

        res.status(200).json({
            success: true,
            data: {
                activeCustomerCount: activeCustomers.length,
                totalLiability,
                totalPaymentsInRange,
                rankedCustomers,
                overdue: {
                    count: overdueCount,
                    totalValue: overdueTotalValue,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
