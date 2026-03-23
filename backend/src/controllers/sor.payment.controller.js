const SORPayment = require('../models/SORPayment');
const SORCustomer = require('../models/SORCustomer');
const { computeLiability } = require('../services/sor.paymentTracker.service');

// @desc    Record a payment for an SOR customer
// @route   POST /api/sor/payments
// @access  Staff
exports.recordPayment = async (req, res, next) => {
    try {
        const { customer: customerId, amount, paymentDate, referenceNote, items, confirmed } = req.body;

        // Req 4.3: amount must be > 0
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be greater than zero',
            });
        }

        // Validate required fields
        if (!customerId) {
            return res.status(400).json({ success: false, message: 'Customer is required' });
        }
        if (!paymentDate) {
            return res.status(400).json({ success: false, message: 'Payment date is required' });
        }

        // Validate items if provided
        if (items && Array.isArray(items)) {
            for (const item of items) {
                if (!item.product) {
                    return res.status(400).json({ success: false, message: 'Each item must have a product' });
                }
                if (!item.quantity || item.quantity < 1) {
                    return res.status(400).json({ success: false, message: 'Each item must have a quantity of at least 1' });
                }
                if (item.price == null || item.price < 0) {
                    return res.status(400).json({ success: false, message: 'Each item must have a non-negative price' });
                }
            }
        }

        // Validate customer exists
        const customer = await SORCustomer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'SOR customer not found' });
        }

        // Req 4.4: overpayment two-step confirmation
        const { outstandingLiability } = await computeLiability(customerId);
        if (amount > outstandingLiability && confirmed !== true) {
            return res.status(200).json({
                success: true,
                warning: 'Payment exceeds outstanding liability',
                requiresConfirmation: true,
            });
        }

        // Req 4.1 + 4.6: create the payment, recording the staff member
        const payment = await SORPayment.create({
            customer: customerId,
            amount,
            paymentDate,
            referenceNote,
            items: items || [],
            recordedBy: req.user.id,
        });

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payments for a customer
// @route   GET /api/sor/payments?customer=:id
// @access  Staff
exports.getPayments = async (req, res, next) => {
    try {
        const { customer: customerId } = req.query;

        if (!customerId) {
            return res.status(400).json({ success: false, message: 'Customer query parameter is required' });
        }

        // Req 4.5: ordered by paymentDate descending
        const payments = await SORPayment.find({ customer: customerId })
            .sort({ paymentDate: -1 })
            .populate('recordedBy', 'name email')
            .populate('items.product', 'name sku');

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a payment
// @route   DELETE /api/sor/payments/:id
// @access  Admin
exports.deletePayment = async (req, res, next) => {
    try {
        const payment = await SORPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'SOR payment not found' });
        }

        // Req 4.7: delete the payment; liability recalculates automatically (computed on-the-fly)
        await payment.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
