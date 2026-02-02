const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const StockLedger = require('../models/StockLedger');
const InventoryBalance = require('../models/InventoryBalance');
const InventoryTransfer = require('../models/InventoryTransfer');
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

// @desc    Transfer stock between warehouses
// @route   POST /api/inventory/transfer
// @access  Private (Manage Inventory)
exports.transferStock = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { product, sourceWarehouse, destinationWarehouse, quantity, reason } = req.body;

        // Validation
        if (sourceWarehouse === destinationWarehouse) {
            return res.status(400).json({
                success: false,
                message: 'Source and destination warehouses cannot be the same',
            });
        }

        // 1. Verify Product and Warehouses exist
        const [productExists, sourceExists, destExists] = await Promise.all([
            Product.findById(product),
            Warehouse.findById(sourceWarehouse),
            Warehouse.findById(destinationWarehouse),
        ]);

        if (!productExists || !sourceExists || !destExists) {
            return res.status(404).json({
                success: false,
                message: 'Product or Warehouse not found',
            });
        }

        // 2. Check if source warehouse has enough stock
        const sourceBalance = await InventoryBalance.findOne({
            product,
            warehouse: sourceWarehouse,
        });

        if (!sourceBalance || sourceBalance.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock in source warehouse',
            });
        }

        // 3. Create transfer record
        const transfer = await InventoryTransfer.create({
            product,
            sourceWarehouse,
            destinationWarehouse,
            quantity,
            reason,
            status: 'COMPLETED',
            initiatedBy: req.user.id,
        });

        // 4. Update source warehouse (TRANSFER_OUT)
        const updatedSourceBalance = await InventoryBalance.findOneAndUpdate(
            { product, warehouse: sourceWarehouse },
            {
                $inc: { quantity: -quantity },
                $set: { lastUpdated: new Date() },
            },
            { new: true }
        );

        // 5. Update destination warehouse (TRANSFER_IN)
        const updatedDestBalance = await InventoryBalance.findOneAndUpdate(
            { product, warehouse: destinationWarehouse },
            {
                $inc: { quantity: quantity },
                $set: { lastUpdated: new Date() },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        // 6. Create ledger entries for both warehouses
        await StockLedger.create([
            {
                product,
                warehouse: sourceWarehouse,
                change: -quantity,
                type: 'TRANSFER_OUT',
                reason: `Transfer to ${destExists.name}: ${reason}`,
                reference: transfer._id.toString(),
                balanceAfter: updatedSourceBalance.quantity,
                performedBy: req.user.id,
            },
            {
                product,
                warehouse: destinationWarehouse,
                change: quantity,
                type: 'TRANSFER_IN',
                reason: `Transfer from ${sourceExists.name}: ${reason}`,
                reference: transfer._id.toString(),
                balanceAfter: updatedDestBalance.quantity,
                performedBy: req.user.id,
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                transfer,
                sourceBalance: updatedSourceBalance,
                destinationBalance: updatedDestBalance,
            },
        });
    } catch (error) {
        next(error);
    }
};
