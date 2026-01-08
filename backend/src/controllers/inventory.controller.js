const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const StockLedger = require('../models/StockLedger');
const InventoryBalance = require('../models/InventoryBalance');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

// @desc    Adjust stock (IN, OUT, ADJUSTMENT, TRANSFER)
// @route   POST /api/inventory/adjust
// @access  Private (Manage Inventory)
exports.adjustStock = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await session.endSession();
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { product, warehouse, change, type, reason, reference } = req.body;

        // Start Transaction
        session.startTransaction();

        // 1. Verify Product and Warehouse exist
        const productExists = await Product.findById(product).session(session);
        const warehouseExists = await Warehouse.findById(warehouse).session(session);

        if (!productExists || !warehouseExists) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Product or Warehouse not found',
            });
        }

        // 2. Update Inventory Balance (Upsert)
        // We strive for atomicity. $inc ensures concurrency safety for the number.
        const updatedBalance = await InventoryBalance.findOneAndUpdate(
            { product, warehouse },
            {
                $inc: { quantity: change },
                $set: { lastUpdated: new Date() },
            },
            {
                new: true,
                upsert: true, // Create if doesn't exist
                session,
                setDefaultsOnInsert: true,
            }
        );

        // 3. Create Ledger Entry
        const ledgerEntry = await StockLedger.create(
            [
                {
                    product,
                    warehouse,
                    change,
                    type,
                    reason,
                    reference,
                    balanceAfter: updatedBalance.quantity,
                    performedBy: req.user.id,
                },
            ],
            { session }
        );

        // Commit Transaction
        await session.commitTransaction();
        await session.endSession();

        res.status(200).json({
            success: true,
            data: {
                balance: updatedBalance,
                ledger: ledgerEntry[0],
            },
        });

    } catch (error) {
        // Abort on error
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        await session.endSession();

        // Check for specific transaction errors (like standalone mongo)
        if (error.message && error.message.includes('Transactions are not supported')) {
            // Fallback for standalone: manual sequential updates (risky but needed sometimes)
            // For this specific 'Advanced Agentic Coding' scenario, we might want to just let it fail 
            // or notify the user. But let's try to be helpful. 
            // Actually, I'll let it fail so I know if I need to fix the environment or code.
            // User can restart mongo as replica set if needed.
        }
        next(error);
    }
};

// @desc    Get current inventory balance
// @route   GET /api/inventory/balance
// @access  Private (View Inventory)
exports.getBalance = async (req, res, next) => {
    try {
        const { warehouseId, productId } = req.query;
        const query = {};

        if (warehouseId) query.warehouse = warehouseId;
        if (productId) query.product = productId;

        const balances = await InventoryBalance.find(query)
            .populate('product', 'name sku cartonSize')
            .populate('warehouse', 'name');

        res.status(200).json({
            success: true,
            count: balances.length,
            data: balances,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get stock ledger history
// @route   GET /api/inventory/ledger
// @access  Private (View Inventory)
exports.getLedger = async (req, res, next) => {
    try {
        const { warehouseId, productId } = req.query;
        const query = {};

        if (warehouseId) query.warehouse = warehouseId;
        if (productId) query.product = productId;

        const ledger = await StockLedger.find(query)
            .populate('product', 'name sku')
            .populate('warehouse', 'name')
            .populate('performedBy', 'email')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 entries for safety

        res.status(200).json({
            success: true,
            count: ledger.length,
            data: ledger,
        });
    } catch (error) {
        next(error);
    }
};
