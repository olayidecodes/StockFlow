const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const StockLedger = require('../models/StockLedger');
const InventoryBalance = require('../models/InventoryBalance');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales/Admin)
exports.createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { customer, region, warehouse, items } = req.body;

        // Calculate total if prices provided (simple mock for now)
        const totalAmount = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

        const order = await Order.create({
            customer,
            region,
            warehouse,
            items,
            totalAmount,
            createdBy: req.user.id,
            status: 'DRAFT',
            logs: [{ status: 'DRAFT', changedBy: req.user.id }],
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

        // 1. Confirming Order: Reserve Stock
        if (status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
            for (const item of order.items) {
                // Check availability
                const balance = await InventoryBalance.findOne({
                    product: item.product,
                    warehouse: order.warehouse,
                }).session(session);

                if (!balance) {
                    throw new Error(`Stock record not found for product ${item.product}`);
                }

                const available = balance.quantity - balance.allocated;
                if (available < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.product}. Available: ${available}, Requested: ${item.quantity}`);
                }

                // Reserve (Increase Allocated)
                balance.allocated += item.quantity;
                await balance.save({ session });
            }
        }

        // 2. Dispatching Order: Deduct Stock
        else if (status === 'DISPATCHED' && oldStatus === 'CONFIRMED') {
            for (const item of order.items) {
                const balance = await InventoryBalance.findOne({
                    product: item.product,
                    warehouse: order.warehouse,
                }).session(session);

                if (!balance) {
                    throw new Error(`Stock record missing during dispatch for product ${item.product}`);
                }

                // Deduct from Physical and Allocated
                balance.quantity -= item.quantity;
                balance.allocated -= item.quantity;
                await balance.save({ session });

                // Ledger Entry
                await StockLedger.create(
                    [
                        {
                            product: item.product,
                            warehouse: order.warehouse,
                            change: -item.quantity,
                            type: 'OUT', // Sale
                            reason: `Order Dispatch #${order._id}`,
                            reference: order._id.toString(),
                            balanceAfter: balance.quantity,
                            performedBy: req.user.id,
                        },
                    ],
                    { session }
                );
            }
        }

        // 3. Cancelling Order: Release Reservation
        else if (status === 'CANCELLED' && oldStatus === 'CONFIRMED') {
            for (const item of order.items) {
                const balance = await InventoryBalance.findOne({
                    product: item.product,
                    warehouse: order.warehouse,
                }).session(session);

                if (balance) {
                    balance.allocated -= item.quantity;
                    // Safety check
                    if (balance.allocated < 0) balance.allocated = 0;
                    await balance.save({ session });
                }
            }
        }

        // Prevent invalid jumps (Basic check)
        if (oldStatus === 'DISPATCHED' && status !== 'DISPATCHED') {
            throw new Error('Cannot change status of dispatched order');
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
