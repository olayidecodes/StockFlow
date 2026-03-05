const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const StockLedger = require('../models/StockLedger');
const InventoryBalance = require('../models/InventoryBalance');
const WhatsAppService = require('../services/whatsapp.service');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales/Admin)
exports.createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { customer, region, warehouse, items, subtotal, discountAmount, discountType } = req.body;

        // Calculate total if prices provided (simple mock for now)
        const totalAmount = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

        const order = await Order.create({
            customer,
            region,
            warehouse,
            items,
            subtotal,
            discountAmount,
            discountType,
            totalAmount,
            createdBy: req.user.id,
            status: 'PENDING',
            logs: [{ status: 'PENDING', changedBy: req.user.id }],
        });

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
    try {
        const { status, warehouseId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (warehouseId) query.warehouse = warehouseId;

        const orders = await Order.find(query)
            .populate('warehouse', 'name')
            .populate('customer')
            .populate('items.product', 'name sku')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('warehouse', 'name')
            .populate('region', 'name')
            .populate('items.product', 'name sku cartonSize')
            .populate('logs.changedBy', 'email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (The Core Logic)
// @route   PUT /api/orders/:id/status
// @access  Private (Sales/Inventory/Admin)
exports.updateOrderStatus = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const { status } = req.body;

        // Start Transaction
        session.startTransaction();

        const order = await Order.findById(req.params.id).session(session);
        if (!order) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const oldStatus = order.status;

        // --- State Machine & Inventory Logic ---

        // 1. Confirming Order: Reserve and Deduct Stock (2-step simplification)
        if (status === 'CONFIRMED' && oldStatus === 'PENDING') {
            for (const item of order.items) {
                // Check availability
                const balance = await InventoryBalance.findOne({
                    product: item.product,
                    warehouse: order.warehouse,
                }).session(session);

                const currentQuantity = balance ? balance.quantity : 0;
                const currentAllocated = balance ? balance.allocated : 0;
                const available = currentQuantity - currentAllocated;

                if (available < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.product}. Available: ${available}, Requested: ${item.quantity}`);
                }

                if (!balance) {
                    // This case should theoretically be caught by available < item.quantity if item.quantity > 0
                    // but we keep it safe. If it ever gets here, it means we are trying to deduct 0 or less?
                    throw new Error(`Stock record not found for product ${item.product}`);
                }

                // Deduct from Physical Stock (since we are bypassing DISPATCHED)
                balance.quantity -= item.quantity;
                await balance.save({ session });

                // Ledger Entry
                await StockLedger.create(
                    [
                        {
                            product: item.product,
                            warehouse: order.warehouse,
                            change: -item.quantity,
                            type: 'OUT',
                            reason: `Order Confirmed #${order._id}`,
                            reference: order._id.toString(),
                            balanceAfter: balance.quantity,
                            performedBy: req.user.id,
                        },
                    ],
                    { session }
                );
            }
        }

        // 2. Cancelling Order: Logic stays similar if needed, but simplified
        else if (status === 'CANCELLED' && oldStatus === 'PENDING') {
            // No stock was reserved yet in the new flow, so just update status
        }

        // Prevent invalid jumps (Basic check)
        if (oldStatus === 'CONFIRMED' && status === 'PENDING') {
            throw new Error('Cannot revert confirmed order to pending');
        }

        // Update Order
        order.status = status;
        order.logs.push({
            status,
            changedBy: req.user.id,
            date: new Date(),
        });

        await order.save({ session });

        await session.commitTransaction();
        await session.endSession();

        // Trigger WhatsApp Message (Outside Transaction but after success)
        if (status === 'CONFIRMED') {
            try {
                // Re-fetch populated order for the message
                const populatedOrder = await Order.findById(order._id)
                    .populate('items.product', 'name')
                    .populate('customer');

                await WhatsAppService.sendOrderConfirmation(populatedOrder);
            } catch (wsError) {
                console.error('WhatsApp trigger failed:', wsError);
                // Note: We don't fail the request if just WhatsApp fails, 
                // but in production you might want a queue/retry mechanism
            }
        }

        res.status(200).json({
            success: true,
            data: order,
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        await session.endSession();

        // Handle specific business logic errors
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        next(error);
    }
};
