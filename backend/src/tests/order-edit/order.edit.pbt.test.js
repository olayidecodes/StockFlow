'use strict';

// ---------------------------------------------------------------------------
// Property-Based Tests for order.edit.service.js
// Feature: order-edit
// Each property runs a minimum of 100 iterations.
// ---------------------------------------------------------------------------

jest.mock('../../models/Order');
jest.mock('../../services/receipt.service');
jest.mock('../../services/invoice.service');
jest.mock('../../services/whatsapp.service');

const fc = require('fast-check');
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
 * Build a minimal mock order document.
 */
function makeMockOrder(overrides = {}) {
    const order = {
        _id: makeObjectId(),
        orderNumber: 1,
        status: 'PENDING',
        customer: { name: 'Test', address: '1 St', phone: '0800', email: 'a@b.com', country: 'Nigeria' },
        region: makeObjectId(),
        warehouse: makeObjectId(),
        items: [{ product: makeObjectId(), quantity: 1, price: 100 }],
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
 * Set up Order.findById to return the mock order on the first call and a
 * populated version on the second call (after save).
 * Supports 4 chained .populate() calls.
 */
function setupOrderFindById(mockOrder) {
    const populated = {
        ...mockOrder,
        warehouse: { _id: mockOrder.warehouse, name: 'WH' },
        region: { _id: mockOrder.region, name: 'Region' },
        items: mockOrder.items.map(i => ({
            ...i,
            product: { _id: i.product, name: 'Prod', sku: 'SKU', cartonSize: 1 },
        })),
        logs: mockOrder.logs.map(l => ({ ...l })),
    };

    // Build a chainable populate mock that resolves on the 4th call
    function makeChain(depth) {
        if (depth === 0) {
            return { populate: jest.fn().mockResolvedValue(populated) };
        }
        const chain = { populate: jest.fn() };
        chain.populate.mockReturnValue(makeChain(depth - 1));
        return chain;
    }

    const populateChain = makeChain(3);

    Order.findById
        .mockResolvedValueOnce(mockOrder)
        .mockReturnValueOnce(populateChain);

    return populated;
}

beforeEach(() => {
    jest.clearAllMocks();

    ReceiptService.receiptExists = jest.fn().mockReturnValue(false);
    ReceiptService.deleteReceipt = jest.fn();
    ReceiptService.generateReceipt = jest.fn().mockResolvedValue('/receipt.pdf');

    InvoiceService.invoiceExists = jest.fn().mockReturnValue(false);
    InvoiceService.deleteInvoice = jest.fn();
    InvoiceService.generateInvoice = jest.fn().mockResolvedValue('/invoice.pdf');

    WhatsAppService.sendMessage = jest.fn().mockResolvedValue({ success: true });
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const objectIdStringArb = fc.constant(null).map(() => makeObjectId().toString());

const validItemArb = fc.record({
    product: objectIdStringArb,
    quantity: fc.integer({ min: 1, max: 1000 }),
    price: fc.float({ min: 0, max: 10000, noNaN: true }),
});

const validItemsArb = fc.array(validItemArb, { minLength: 1, maxLength: 10 });

const discountTypeArb = fc.constantFrom('none', 'individual', 'global');

const validPayloadArb = fc.record({
    customer: fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        address: fc.string({ minLength: 1, maxLength: 100 }),
        phone: fc.string({ minLength: 1, maxLength: 20 }),
        email: fc.string({ minLength: 1, maxLength: 50 }),
        country: fc.string({ minLength: 1, maxLength: 30 }),
    }),
    items: validItemsArb,
    discountAmount: fc.float({ min: 0, max: 5000, noNaN: true }),
    discountType: discountTypeArb,
    deliveryFee: fc.float({ min: 0, max: 5000, noNaN: true }),
    orderType: fc.constantFrom('RETAIL', 'WHOLESALE'),
    channel: fc.constantFrom('Instagram', 'Google', 'Facebook', 'Referral', 'Walk-in', 'Other'),
});

// ---------------------------------------------------------------------------
// Property 3: Immutable fields are never overwritten
// Feature: order-edit, Property 3: Immutable fields are never overwritten
// Validates: Requirements 2.2
// ---------------------------------------------------------------------------

describe('Property 3: Immutable fields are never overwritten', () => {
    test('orderNumber, createdBy, status, createdAt are preserved regardless of payload', async () => {
        await fc.assert(
            fc.asyncProperty(
                validPayloadArb,
                fc.integer({ min: 1, max: 99999 }),          // attacker orderNumber
                fc.string({ minLength: 1, maxLength: 24 }),   // attacker createdBy
                fc.constantFrom('PENDING', 'CONFIRMED', 'CANCELLED', 'DELETED'), // attacker status
                fc.date({ min: new Date('2000-01-01'), max: new Date('2099-01-01') }), // attacker createdAt
                async (basePayload, attackOrderNumber, attackCreatedBy, attackStatus, attackCreatedAt) => {
                    const originalOrderNumber = 42;
                    const originalCreatedBy = makeObjectId();
                    const originalStatus = 'PENDING';
                    const originalCreatedAt = new Date('2024-06-01');

                    const order = makeMockOrder({
                        orderNumber: originalOrderNumber,
                        createdBy: originalCreatedBy,
                        status: originalStatus,
                        createdAt: originalCreatedAt,
                    });

                    setupOrderFindById(order);

                    const payload = {
                        ...basePayload,
                        orderNumber: attackOrderNumber,
                        createdBy: attackCreatedBy,
                        status: attackStatus,
                        createdAt: attackCreatedAt,
                    };

                    const userId = makeObjectId().toString();
                    await editOrder(order._id.toString(), payload, userId);

                    expect(order.orderNumber).toBe(originalOrderNumber);
                    expect(order.createdBy).toEqual(originalCreatedBy);
                    expect(order.status).toBe(originalStatus);
                    expect(order.createdAt).toEqual(originalCreatedAt);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ---------------------------------------------------------------------------
// Property 5: Subtotal recalculation invariant
// Feature: order-edit, Property 5: Subtotal recalculation invariant
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe('Property 5: Subtotal recalculation invariant', () => {
    test('persisted subtotal equals sum(item.quantity × item.price) for any valid items', async () => {
        await fc.assert(
            fc.asyncProperty(
                validItemsArb,
                async (items) => {
                    const order = makeMockOrder({ status: 'PENDING' });
                    setupOrderFindById(order);

                    const userId = makeObjectId().toString();
                    const payload = {
                        customer: order.customer,
                        items,
                        discountAmount: 0,
                        discountType: 'none',
                        deliveryFee: 0,
                        orderType: 'RETAIL',
                        channel: 'Other',
                    };

                    await editOrder(order._id.toString(), payload, userId);

                    const expectedSubtotal = items.reduce(
                        (sum, item) => sum + item.quantity * item.price,
                        0
                    );

                    expect(order.subtotal).toBeCloseTo(expectedSubtotal, 5);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ---------------------------------------------------------------------------
// Property 6: Total amount recalculation invariant
// Feature: order-edit, Property 6: Total amount recalculation invariant
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------

describe('Property 6: Total amount recalculation invariant', () => {
    test('totalAmount = max(0, subtotal - effectiveDiscount + deliveryFee) for any valid payload', async () => {
        await fc.assert(
            fc.asyncProperty(
                validItemsArb,
                fc.float({ min: 0, max: 5000, noNaN: true }),
                discountTypeArb,
                fc.float({ min: 0, max: 5000, noNaN: true }),
                async (items, discountAmount, discountType, deliveryFee) => {
                    const order = makeMockOrder({ status: 'PENDING' });
                    setupOrderFindById(order);

                    const userId = makeObjectId().toString();
                    const payload = {
                        customer: order.customer,
                        items,
                        discountAmount,
                        discountType,
                        deliveryFee,
                        orderType: 'RETAIL',
                        channel: 'Other',
                    };

                    await editOrder(order._id.toString(), payload, userId);

                    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
                    const effectiveDiscount = discountType === 'none' ? 0 : discountAmount;
                    const expectedTotal = Math.max(0, subtotal - effectiveDiscount + deliveryFee);

                    expect(order.totalAmount).toBeCloseTo(expectedTotal, 5);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('totalAmount is never negative', async () => {
        await fc.assert(
            fc.asyncProperty(
                validItemsArb,
                fc.float({ min: 0, max: 5000, noNaN: true }),
                fc.constantFrom('individual', 'global'),
                fc.float({ min: 0, max: 5000, noNaN: true }),
                async (items, discountAmount, discountType, deliveryFee) => {
                    const order = makeMockOrder({ status: 'PENDING' });
                    setupOrderFindById(order);

                    const userId = makeObjectId().toString();
                    const payload = {
                        customer: order.customer,
                        items,
                        discountAmount,
                        discountType,
                        deliveryFee,
                        orderType: 'RETAIL',
                        channel: 'Other',
                    };

                    await editOrder(order._id.toString(), payload, userId);

                    expect(order.totalAmount).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ---------------------------------------------------------------------------
// Property 10: Edit audit log entry is appended
// Feature: order-edit, Property 10: Edit audit log entry is appended
// Validates: Requirements 6.1
// ---------------------------------------------------------------------------

describe('Property 10: Edit audit log entry is appended', () => {
    test('after a successful edit, logs contains a new EDITED entry with correct changedBy and a recent date', async () => {
        await fc.assert(
            fc.asyncProperty(
                validPayloadArb,
                async (payload) => {
                    const order = makeMockOrder({ status: 'PENDING', logs: [] });
                    setupOrderFindById(order);

                    const userId = makeObjectId().toString();
                    const before = new Date();

                    await editOrder(order._id.toString(), payload, userId);

                    const after = new Date();

                    const lastLog = order.logs[order.logs.length - 1];
                    expect(lastLog).toBeDefined();
                    expect(lastLog.status).toBe('EDITED');
                    expect(lastLog.changedBy.toString()).toBe(userId.toString());
                    expect(lastLog.date).toBeInstanceOf(Date);
                    expect(lastLog.date.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
                    expect(lastLog.date.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('EDITED log entry is always the last entry appended', async () => {
        await fc.assert(
            fc.asyncProperty(
                validPayloadArb,
                fc.integer({ min: 0, max: 5 }),
                async (payload, existingLogCount) => {
                    const existingLogs = Array.from({ length: existingLogCount }, () => ({
                        status: 'PENDING',
                        changedBy: makeObjectId(),
                        date: new Date('2024-01-01'),
                    }));

                    const order = makeMockOrder({ status: 'PENDING', logs: existingLogs });
                    setupOrderFindById(order);

                    const userId = makeObjectId().toString();
                    await editOrder(order._id.toString(), payload, userId);

                    expect(order.logs.length).toBe(existingLogCount + 1);
                    expect(order.logs[order.logs.length - 1].status).toBe('EDITED');
                }
            ),
            { numRuns: 100 }
        );
    });
});
