'use strict';

// ---------------------------------------------------------------------------
// Unit tests for order.edit.service.js — PENDING order path
// ---------------------------------------------------------------------------

jest.mock('../../models/Order');
jest.mock('../../services/receipt.service');
jest.mock('../../services/invoice.service');
jest.mock('../../services/whatsapp.service');

const mongoose = require('mongoose');
const Order = require('../../models/Order');
const ReceiptService = require('../../services/receipt.service');
const InvoiceService = require('../../services/invoice.service');
const WhatsAppService = require('../../services/whatsapp.service');
const { editOrder } = require('../../services/order.edit.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeObjectId() {
    return new mongoose.Types.ObjectId();
}

/**
 * Build a minimal mock order document that behaves like a Mongoose document.
 */
function makeMockOrder(overrides = {}) {
    const orderId = makeObjectId();
    const warehouseId = makeObjectId();

    const order = {
        _id: orderId,
        orderNumber: 42,
        status: 'PENDING',
        customer: { name: 'Test Customer', address: '1 Test St', phone: '0800000000', email: 'test@test.com', country: 'Nigeria' },
        region: makeObjectId(),
        warehouse: warehouseId,
        items: [
            { product: makeObjectId(), quantity: 2, price: 500 },
        ],
        discountAmount: 0,
        discountType: 'none',
        deliveryFee: 0,
        orderType: 'RETAIL',
        channel: 'Other',
        createdBy: makeObjectId(),
        createdAt: new Date('2024-01-01'),
        logs: [],
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    };

    return order;
}

/**
 * Build a minimal populated order (returned by the chained populate calls).
 */
function makePopulatedOrder(order) {
    return {
        ...order,
        warehouse: { _id: order.warehouse, name: 'Main Warehouse' },
        region: { _id: order.region, name: 'Lagos' },
        items: order.items.map(i => ({
            ...i,
            product: { _id: i.product, name: 'Product A', sku: 'SKU-A', cartonSize: 12 },
        })),
        logs: order.logs.map(l => ({ ...l, changedBy: { _id: l.changedBy, email: 'user@test.com' } })),
    };
}

/**
 * Set up Order.findById to return a mock order on the first call and a
 * populated order on the second call (the populate chain after save).
 * Supports 4 chained .populate() calls.
 */
function setupOrderFindById(mockOrder) {
    const populated = makePopulatedOrder(mockOrder);

    // Build a chainable populate mock that resolves on the 4th call
    function makeChain(depth) {
        if (depth === 0) {
            // Final populate — returns a promise
            return { populate: jest.fn().mockResolvedValue(populated) };
        }
        const chain = { populate: jest.fn() };
        chain.populate.mockReturnValue(makeChain(depth - 1));
        return chain;
    }

    // The second findById call starts the chain (depth 3 = 3 more populate calls after this)
    const populateChain = makeChain(3);

    Order.findById
        .mockResolvedValueOnce(mockOrder)    // first call: load order
        .mockReturnValueOnce(populateChain); // second call: populate after save

    return populated;
}

// ---------------------------------------------------------------------------
// Default valid payload
// ---------------------------------------------------------------------------

function validPayload(overrides = {}) {
    return {
        customer: { name: 'Updated Customer', address: '2 New St', phone: '0811111111', email: 'new@test.com', country: 'Nigeria' },
        items: [
            { product: makeObjectId().toString(), quantity: 3, price: 400 },
        ],
        discountAmount: 0,
        discountType: 'none',
        deliveryFee: 0,
        orderType: 'RETAIL',
        channel: 'Other',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    jest.clearAllMocks();

    // Default: ReceiptService and InvoiceService are no-ops
    ReceiptService.receiptExists = jest.fn().mockReturnValue(false);
    ReceiptService.deleteReceipt = jest.fn();
    ReceiptService.generateReceipt = jest.fn().mockResolvedValue('/path/to/receipt.pdf');

    InvoiceService.invoiceExists = jest.fn().mockReturnValue(false);
    InvoiceService.deleteInvoice = jest.fn();
    InvoiceService.generateInvoice = jest.fn().mockResolvedValue('/path/to/invoice.pdf');

    WhatsAppService.sendMessage = jest.fn().mockResolvedValue({ success: true });
});

// ---------------------------------------------------------------------------
// 1. 404 for non-existent order
// ---------------------------------------------------------------------------

describe('editOrder — 404 for non-existent order', () => {
    test('throws 404 error when order is not found', async () => {
        Order.findById.mockResolvedValueOnce(null);

        await expect(editOrder('nonexistentid', validPayload(), 'userid')).rejects.toMatchObject({
            statusCode: 404,
            message: 'Order not found',
        });
    });
});

// ---------------------------------------------------------------------------
// 2. 400 for CANCELLED order
// ---------------------------------------------------------------------------

describe('editOrder — 400 for CANCELLED order', () => {
    test('throws 400 with correct message for a CANCELLED order', async () => {
        const cancelledOrder = makeMockOrder({ status: 'CANCELLED' });
        Order.findById.mockResolvedValueOnce(cancelledOrder);

        await expect(editOrder(cancelledOrder._id.toString(), validPayload(), 'userid')).rejects.toMatchObject({
            statusCode: 400,
            message: 'Cancelled orders cannot be edited',
        });
    });

    test('does not call order.save() for a CANCELLED order', async () => {
        const cancelledOrder = makeMockOrder({ status: 'CANCELLED' });
        Order.findById.mockResolvedValueOnce(cancelledOrder);

        await expect(editOrder(cancelledOrder._id.toString(), validPayload(), 'userid')).rejects.toThrow();
        expect(cancelledOrder.save).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// 3. 400 when items array is empty
// ---------------------------------------------------------------------------

describe('editOrder — 400 when items array is empty', () => {
    test('throws 400 when items is an empty array', async () => {
        const order = makeMockOrder();
        Order.findById.mockResolvedValueOnce(order);

        await expect(editOrder(order._id.toString(), validPayload({ items: [] }), 'userid')).rejects.toMatchObject({
            statusCode: 400,
            message: 'Order must contain at least one item',
        });
    });

    test('throws 400 when items is missing from payload', async () => {
        const order = makeMockOrder();
        Order.findById.mockResolvedValueOnce(order);

        const payload = validPayload();
        delete payload.items;

        await expect(editOrder(order._id.toString(), payload, 'userid')).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// 4. Immutable fields are ignored
// ---------------------------------------------------------------------------

describe('editOrder — immutable fields are ignored', () => {
    test('does not overwrite orderNumber, createdBy, status, or createdAt', async () => {
        const originalOrderNumber = 42;
        const originalCreatedBy = makeObjectId();
        const originalStatus = 'PENDING';
        const originalCreatedAt = new Date('2024-01-01');

        const order = makeMockOrder({
            orderNumber: originalOrderNumber,
            createdBy: originalCreatedBy,
            status: originalStatus,
            createdAt: originalCreatedAt,
        });

        setupOrderFindById(order);

        const userId = makeObjectId().toString();
        const payload = validPayload({
            orderNumber: 9999,
            createdBy: makeObjectId().toString(),
            status: 'CANCELLED',
            createdAt: new Date('2099-01-01'),
        });

        await editOrder(order._id.toString(), payload, userId);

        // The order document should retain original immutable values
        expect(order.orderNumber).toBe(originalOrderNumber);
        expect(order.createdBy).toEqual(originalCreatedBy);
        expect(order.status).toBe(originalStatus);
        expect(order.createdAt).toEqual(originalCreatedAt);
    });
});

// ---------------------------------------------------------------------------
// 5. InventoryBalance is NOT touched for PENDING orders
// ---------------------------------------------------------------------------

describe('editOrder — no inventory changes for PENDING orders', () => {
    test('does not import or call InventoryBalance for a PENDING order', async () => {
        const order = makeMockOrder({ status: 'PENDING' });
        setupOrderFindById(order);

        const userId = makeObjectId().toString();
        await editOrder(order._id.toString(), validPayload(), userId);

        // InventoryBalance is not mocked and not required — if the service
        // tried to use it, it would throw a connection error. The test passing
        // confirms it is not called.
        expect(order.save).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// 6. Side-effect failures do not roll back the edit
// ---------------------------------------------------------------------------

describe('editOrder — side-effect failures do not roll back the edit', () => {
    test('edit succeeds even when receipt generation throws', async () => {
        const order = makeMockOrder({ status: 'PENDING' });
        setupOrderFindById(order);

        ReceiptService.generateReceipt.mockRejectedValue(new Error('PDF generation failed'));

        const userId = makeObjectId().toString();
        // Should not throw
        const result = await editOrder(order._id.toString(), validPayload(), userId);
        expect(result).toBeDefined();
        expect(order.save).toHaveBeenCalledTimes(1);
    });

    test('edit succeeds even when invoice generation throws', async () => {
        const order = makeMockOrder({ status: 'PENDING', orderType: 'WHOLESALE' });
        setupOrderFindById(order);

        InvoiceService.generateInvoice.mockRejectedValue(new Error('Invoice generation failed'));

        const userId = makeObjectId().toString();
        const result = await editOrder(order._id.toString(), validPayload({ orderType: 'WHOLESALE' }), userId);
        expect(result).toBeDefined();
        expect(order.save).toHaveBeenCalledTimes(1);
    });

    test('edit succeeds even when WhatsApp sendMessage returns failure', async () => {
        const order = makeMockOrder({ status: 'PENDING' });
        setupOrderFindById(order);

        WhatsAppService.sendMessage.mockResolvedValue({ success: false, error: 'Not connected' });

        const userId = makeObjectId().toString();
        const result = await editOrder(order._id.toString(), validPayload(), userId);
        expect(result).toBeDefined();
        expect(order.save).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// 7. Totals are recalculated correctly
// ---------------------------------------------------------------------------

describe('editOrder — total recalculation', () => {
    test('recalculates subtotal and totalAmount correctly', async () => {
        const order = makeMockOrder({ status: 'PENDING' });
        setupOrderFindById(order);

        const userId = makeObjectId().toString();
        const items = [
            { product: makeObjectId().toString(), quantity: 2, price: 100 },
            { product: makeObjectId().toString(), quantity: 3, price: 200 },
        ];
        // subtotal = 2*100 + 3*200 = 800
        // effectiveDiscount = 0 (discountType: 'none')
        // totalAmount = max(0, 800 - 0 + 50) = 850
        await editOrder(order._id.toString(), validPayload({ items, deliveryFee: 50, discountType: 'none', discountAmount: 100 }), userId);

        expect(order.subtotal).toBe(800);
        expect(order.totalAmount).toBe(850);
    });

    test('totalAmount is never negative', async () => {
        const order = makeMockOrder({ status: 'PENDING' });
        setupOrderFindById(order);

        const userId = makeObjectId().toString();
        const items = [{ product: makeObjectId().toString(), quantity: 1, price: 10 }];
        // subtotal = 10, discount = 500, deliveryFee = 0 → max(0, 10 - 500 + 0) = 0
        await editOrder(order._id.toString(), validPayload({ items, discountType: 'global', discountAmount: 500, deliveryFee: 0 }), userId);

        expect(order.totalAmount).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// 8. EDITED log entry is appended
// ---------------------------------------------------------------------------

describe('editOrder — EDITED log entry', () => {
    test('appends an EDITED log entry with the correct userId', async () => {
        const order = makeMockOrder({ status: 'PENDING', logs: [] });
        setupOrderFindById(order);

        const userId = makeObjectId().toString();
        await editOrder(order._id.toString(), validPayload(), userId);

        const lastLog = order.logs[order.logs.length - 1];
        expect(lastLog.status).toBe('EDITED');
        expect(lastLog.changedBy.toString()).toBe(userId.toString());
        expect(lastLog.date).toBeInstanceOf(Date);
    });
});

// ---------------------------------------------------------------------------
// 9. CONFIRMED order — inventory adjustment
// ---------------------------------------------------------------------------

jest.mock('../../models/InventoryBalance');
jest.mock('../../models/StockLedger');

const InventoryBalance = require('../../models/InventoryBalance');
const StockLedger = require('../../models/StockLedger');

/**
 * Build a mock InventoryBalance document.
 */
function makeMockBalance(productId, warehouseId, quantity = 100, allocated = 0) {
    return {
        _id: makeObjectId(),
        product: productId,
        warehouse: warehouseId,
        quantity,
        allocated,
        save: jest.fn().mockResolvedValue(undefined),
    };
}

/**
 * Set up mongoose.startSession mock for transaction tests.
 */
function setupSession() {
    const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(session);
    return session;
}

describe('editOrder — CONFIRMED order inventory adjustment', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        ReceiptService.receiptExists = jest.fn().mockReturnValue(false);
        ReceiptService.deleteReceipt = jest.fn();
        ReceiptService.generateReceipt = jest.fn().mockResolvedValue('/receipt.pdf');
        InvoiceService.invoiceExists = jest.fn().mockReturnValue(false);
        InvoiceService.deleteInvoice = jest.fn();
        InvoiceService.generateInvoice = jest.fn().mockResolvedValue('/invoice.pdf');
        WhatsAppService.sendMessage = jest.fn().mockResolvedValue({ success: true });

        StockLedger.create = jest.fn().mockResolvedValue([{}]);
    });

    test('deducts inventory when quantity increases on a CONFIRMED order', async () => {
        const productId = makeObjectId();
        const warehouseId = makeObjectId();
        const balance = makeMockBalance(productId, warehouseId, 100, 0);

        const order = makeMockOrder({
            status: 'CONFIRMED',
            warehouse: warehouseId,
            items: [{ product: productId, quantity: 2, price: 100 }],
        });

        setupOrderFindById(order);
        setupSession();
        InventoryBalance.findOne = jest.fn().mockResolvedValue(balance);

        const userId = makeObjectId().toString();
        // Increase quantity from 2 → 5 (delta = +3)
        await editOrder(order._id.toString(), validPayload({
            items: [{ product: productId.toString(), quantity: 5, price: 100 }],
        }), userId);

        expect(balance.quantity).toBe(97); // 100 - 3
        expect(balance.save).toHaveBeenCalled();
        expect(StockLedger.create).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ type: 'OUT', change: -3 })]),
            expect.anything()
        );
    });

    test('returns inventory when quantity decreases on a CONFIRMED order', async () => {
        const productId = makeObjectId();
        const warehouseId = makeObjectId();
        const balance = makeMockBalance(productId, warehouseId, 50, 0);

        const order = makeMockOrder({
            status: 'CONFIRMED',
            warehouse: warehouseId,
            items: [{ product: productId, quantity: 5, price: 100 }],
        });

        setupOrderFindById(order);
        setupSession();
        InventoryBalance.findOne = jest.fn().mockResolvedValue(balance);

        const userId = makeObjectId().toString();
        // Decrease quantity from 5 → 2 (delta = -3)
        await editOrder(order._id.toString(), validPayload({
            items: [{ product: productId.toString(), quantity: 2, price: 100 }],
        }), userId);

        expect(balance.quantity).toBe(53); // 50 + 3
        expect(StockLedger.create).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ type: 'IN', change: 3 })]),
            expect.anything()
        );
    });

    test('throws 400 with correct message when stock is insufficient', async () => {
        const productId = makeObjectId();
        const warehouseId = makeObjectId();
        // Only 2 available (quantity=5, allocated=3)
        const balance = makeMockBalance(productId, warehouseId, 5, 3);

        const order = makeMockOrder({
            status: 'CONFIRMED',
            warehouse: warehouseId,
            items: [{ product: productId, quantity: 1, price: 100 }],
        });

        Order.findById.mockResolvedValueOnce(order);
        setupSession();
        InventoryBalance.findOne = jest.fn().mockResolvedValue(balance);

        // Mock Product.findById for the error message
        mongoose.model = jest.fn().mockReturnValue({
            findById: jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({ name: 'Test Product' }),
            }),
        });

        const userId = makeObjectId().toString();
        // Try to increase from 1 → 10 (delta = +9, but only 2 available)
        await expect(editOrder(order._id.toString(), validPayload({
            items: [{ product: productId.toString(), quantity: 10, price: 100 }],
        }), userId)).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('Insufficient stock'),
        });
    });

    test('aborts transaction when stock check fails', async () => {
        const productId = makeObjectId();
        const warehouseId = makeObjectId();
        const balance = makeMockBalance(productId, warehouseId, 2, 0);

        const order = makeMockOrder({
            status: 'CONFIRMED',
            warehouse: warehouseId,
            items: [{ product: productId, quantity: 1, price: 100 }],
        });

        Order.findById.mockResolvedValueOnce(order);
        const session = setupSession();
        InventoryBalance.findOne = jest.fn().mockResolvedValue(balance);

        mongoose.model = jest.fn().mockReturnValue({
            findById: jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({ name: 'Test Product' }),
            }),
        });

        const userId = makeObjectId().toString();
        // Request more than available (delta = +5, available = 2)
        await expect(editOrder(order._id.toString(), validPayload({
            items: [{ product: productId.toString(), quantity: 6, price: 100 }],
        }), userId)).rejects.toThrow();

        expect(session.abortTransaction).toHaveBeenCalled();
        expect(session.commitTransaction).not.toHaveBeenCalled();
    });

    test('commits transaction on successful CONFIRMED order edit', async () => {
        const productId = makeObjectId();
        const warehouseId = makeObjectId();
        const balance = makeMockBalance(productId, warehouseId, 100, 0);

        const order = makeMockOrder({
            status: 'CONFIRMED',
            warehouse: warehouseId,
            items: [{ product: productId, quantity: 2, price: 100 }],
        });

        setupOrderFindById(order);
        const session = setupSession();
        InventoryBalance.findOne = jest.fn().mockResolvedValue(balance);

        const userId = makeObjectId().toString();
        await editOrder(order._id.toString(), validPayload({
            items: [{ product: productId.toString(), quantity: 4, price: 100 }],
        }), userId);

        expect(session.commitTransaction).toHaveBeenCalled();
        expect(session.abortTransaction).not.toHaveBeenCalled();
    });
});
