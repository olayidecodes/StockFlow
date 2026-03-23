// Feature: sales-on-return

'use strict';

jest.mock('../../models/SOROrder');
jest.mock('../../models/SORPayment');
jest.mock('../../models/SORCustomer');

const mongoose = require('mongoose');
const SOROrder = require('../../models/SOROrder');
const SORPayment = require('../../models/SORPayment');
const SORCustomer = require('../../models/SORCustomer');

const {
    computeLiability,
    getLedger,
    getSummary,
} = require('../../services/sor.paymentTracker.service');

// A stable customer ObjectId used across tests
const CUSTOMER_ID = new mongoose.Types.ObjectId().toString();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal SOROrder mock with a populated order sub-document */
function makeSOROrderDoc({ totalAmount, status = 'CONFIRMED', createdAt = new Date('2024-01-10'), orderNumber = 'ORD-001' }) {
    return {
        order: { totalAmount, status, createdAt, orderNumber },
    };
}

/** Build a minimal SORPayment mock */
function makeSORPaymentDoc({ amount, paymentDate = new Date('2024-01-15'), referenceNote = '' }) {
    return { amount, paymentDate, referenceNote };
}

// ---------------------------------------------------------------------------
// 16.1 — computeLiability
// ---------------------------------------------------------------------------

describe('PaymentTracker.computeLiability', () => {
    afterEach(() => jest.clearAllMocks());

    test('zero orders, zero payments → liability = 0', async () => {
        SOROrder.aggregate.mockResolvedValue([]);
        SORPayment.aggregate.mockResolvedValue([]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.confirmedOrdersTotal).toBe(0);
        expect(result.paymentsTotal).toBe(0);
        expect(result.outstandingLiability).toBe(0);
    });

    test('only confirmed orders, no payments → liability = sum of confirmed orders', async () => {
        SOROrder.aggregate.mockResolvedValue([{ _id: null, total: 500 }]);
        SORPayment.aggregate.mockResolvedValue([]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.confirmedOrdersTotal).toBe(500);
        expect(result.paymentsTotal).toBe(0);
        expect(result.outstandingLiability).toBe(500);
    });

    test('only cancelled orders, no payments → liability = 0 (cancelled orders excluded by aggregation)', async () => {
        // The aggregation pipeline filters CONFIRMED orders; cancelled orders
        // never reach the $group stage, so the result array is empty.
        SOROrder.aggregate.mockResolvedValue([]);
        SORPayment.aggregate.mockResolvedValue([]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.confirmedOrdersTotal).toBe(0);
        expect(result.outstandingLiability).toBe(0);
    });

    test('mix of confirmed and cancelled orders → liability = sum of confirmed only', async () => {
        // Aggregation already filters; only confirmed total (300) is returned
        SOROrder.aggregate.mockResolvedValue([{ _id: null, total: 300 }]);
        SORPayment.aggregate.mockResolvedValue([]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.confirmedOrdersTotal).toBe(300);
        expect(result.outstandingLiability).toBe(300);
    });

    test('confirmed orders + payments → liability = confirmed total - payments total', async () => {
        SOROrder.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);
        SORPayment.aggregate.mockResolvedValue([{ _id: null, total: 400 }]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.confirmedOrdersTotal).toBe(1000);
        expect(result.paymentsTotal).toBe(400);
        expect(result.outstandingLiability).toBe(600);
    });

    test('payments exceed confirmed orders → liability is negative (allowed)', async () => {
        SOROrder.aggregate.mockResolvedValue([{ _id: null, total: 200 }]);
        SORPayment.aggregate.mockResolvedValue([{ _id: null, total: 350 }]);

        const result = await computeLiability(CUSTOMER_ID);

        expect(result.outstandingLiability).toBe(-150);
    });

    test('getSummary returns same values under different field names', async () => {
        SOROrder.aggregate.mockResolvedValue([{ _id: null, total: 800 }]);
        SORPayment.aggregate.mockResolvedValue([{ _id: null, total: 300 }]);

        const summary = await getSummary(CUSTOMER_ID);

        expect(summary.totalOrdered).toBe(800);
        expect(summary.totalPaid).toBe(300);
        expect(summary.outstandingLiability).toBe(500);
    });
});

// ---------------------------------------------------------------------------
// 16.2 — Overpayment warning logic (recordPayment controller)
// ---------------------------------------------------------------------------

describe('recordPayment — overpayment warning and two-step confirmation', () => {
    let recordPayment;

    // We need to re-require the controller after mocking its dependencies
    beforeAll(() => {
        // computeLiability is already mocked via SOROrder/SORPayment mocks above,
        // but the controller imports it directly. We mock the service module.
        jest.mock('../../services/sor.paymentTracker.service', () => ({
            computeLiability: jest.fn(),
        }));

        recordPayment = require('../../controllers/sor.payment.controller').recordPayment;
    });

    afterEach(() => jest.clearAllMocks());

    /** Build a minimal Express-style mock req/res pair */
    function makeReqRes(body) {
        const req = { body, user: { id: new mongoose.Types.ObjectId().toString() } };
        const res = {
            _status: null,
            _json: null,
            status(code) { this._status = code; return this; },
            json(data) { this._json = data; return this; },
        };
        const next = jest.fn();
        return { req, res, next };
    }

    test('amount <= 0 → 400 error', async () => {
        const { req, res, next } = makeReqRes({
            customer: CUSTOMER_ID,
            amount: 0,
            paymentDate: '2024-01-15',
        });

        await recordPayment(req, res, next);

        expect(res._status).toBe(400);
        expect(res._json.success).toBe(false);
    });

    test('negative amount → 400 error', async () => {
        const { req, res, next } = makeReqRes({
            customer: CUSTOMER_ID,
            amount: -50,
            paymentDate: '2024-01-15',
        });

        await recordPayment(req, res, next);

        expect(res._status).toBe(400);
        expect(res._json.success).toBe(false);
    });

    test('amount > outstanding liability, confirmed not set → returns requiresConfirmation: true', async () => {
        const { computeLiability: mockComputeLiability } = require('../../services/sor.paymentTracker.service');
        mockComputeLiability.mockResolvedValue({ outstandingLiability: 100 });

        SORCustomer.findById = jest.fn().mockResolvedValue({ _id: CUSTOMER_ID });

        const { req, res, next } = makeReqRes({
            customer: CUSTOMER_ID,
            amount: 200,
            paymentDate: '2024-01-15',
        });

        await recordPayment(req, res, next);

        expect(res._status).toBe(200);
        expect(res._json.requiresConfirmation).toBe(true);
        expect(res._json.warning).toBeDefined();
    });

    test('amount > outstanding liability, confirmed = true → payment recorded (201)', async () => {
        const { computeLiability: mockComputeLiability } = require('../../services/sor.paymentTracker.service');
        mockComputeLiability.mockResolvedValue({ outstandingLiability: 100 });

        SORCustomer.findById = jest.fn().mockResolvedValue({ _id: CUSTOMER_ID });

        const paymentDoc = {
            _id: new mongoose.Types.ObjectId(),
            customer: CUSTOMER_ID,
            amount: 200,
            paymentDate: new Date('2024-01-15'),
        };
        SORPayment.create = jest.fn().mockResolvedValue(paymentDoc);

        const { req, res, next } = makeReqRes({
            customer: CUSTOMER_ID,
            amount: 200,
            paymentDate: '2024-01-15',
            confirmed: true,
        });

        await recordPayment(req, res, next);

        expect(res._status).toBe(201);
        expect(res._json.success).toBe(true);
        expect(res._json.data).toBeDefined();
    });

    test('amount <= outstanding liability → payment recorded without warning (201)', async () => {
        const { computeLiability: mockComputeLiability } = require('../../services/sor.paymentTracker.service');
        mockComputeLiability.mockResolvedValue({ outstandingLiability: 500 });

        SORCustomer.findById = jest.fn().mockResolvedValue({ _id: CUSTOMER_ID });

        const paymentDoc = {
            _id: new mongoose.Types.ObjectId(),
            customer: CUSTOMER_ID,
            amount: 300,
            paymentDate: new Date('2024-01-15'),
        };
        SORPayment.create = jest.fn().mockResolvedValue(paymentDoc);

        const { req, res, next } = makeReqRes({
            customer: CUSTOMER_ID,
            amount: 300,
            paymentDate: '2024-01-15',
        });

        await recordPayment(req, res, next);

        expect(res._status).toBe(201);
        expect(res._json.requiresConfirmation).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// 16.3 — Ledger assembly (getLedger)
// ---------------------------------------------------------------------------

describe('PaymentTracker.getLedger', () => {
    afterEach(() => jest.clearAllMocks());

    /** Helper: build a chainable mock for SOROrder.find().populate() */
    function mockSOROrderFind(docs) {
        SOROrder.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(docs),
        });
    }

    test('empty orders and payments → empty ledger', async () => {
        mockSOROrderFind([]);
        SORPayment.find = jest.fn().mockResolvedValue([]);

        const ledger = await getLedger(CUSTOMER_ID);

        expect(ledger).toEqual([]);
    });

    test('orders and payments are sorted chronologically ascending', async () => {
        const order1 = makeSOROrderDoc({ totalAmount: 300, createdAt: new Date('2024-01-20'), orderNumber: 'ORD-002' });
        const order2 = makeSOROrderDoc({ totalAmount: 200, createdAt: new Date('2024-01-05'), orderNumber: 'ORD-001' });
        mockSOROrderFind([order1, order2]);

        const pay1 = makeSORPaymentDoc({ amount: 100, paymentDate: new Date('2024-01-12') });
        SORPayment.find = jest.fn().mockResolvedValue([pay1]);

        const ledger = await getLedger(CUSTOMER_ID);

        // Dates should be ascending
        for (let i = 1; i < ledger.length; i++) {
            expect(new Date(ledger[i].date).getTime()).toBeGreaterThanOrEqual(
                new Date(ledger[i - 1].date).getTime()
            );
        }
    });

    test('running balance is computed correctly', async () => {
        const order = makeSOROrderDoc({ totalAmount: 500, createdAt: new Date('2024-01-01'), orderNumber: 'ORD-001' });
        mockSOROrderFind([order]);

        const payment = makeSORPaymentDoc({ amount: 200, paymentDate: new Date('2024-01-10') });
        SORPayment.find = jest.fn().mockResolvedValue([payment]);

        const ledger = await getLedger(CUSTOMER_ID);

        // First entry: order adds 500 → balance = 500
        expect(ledger[0].runningBalance).toBe(500);
        // Second entry: payment subtracts 200 → balance = 300
        expect(ledger[1].runningBalance).toBe(300);
    });

    test('ORDER entries have positive amounts, PAYMENT entries have negative amounts', async () => {
        const order = makeSOROrderDoc({ totalAmount: 400, createdAt: new Date('2024-01-01'), orderNumber: 'ORD-001' });
        mockSOROrderFind([order]);

        const payment = makeSORPaymentDoc({ amount: 150, paymentDate: new Date('2024-01-05') });
        SORPayment.find = jest.fn().mockResolvedValue([payment]);

        const ledger = await getLedger(CUSTOMER_ID);

        const orderEntry = ledger.find(e => e.type === 'ORDER');
        const paymentEntry = ledger.find(e => e.type === 'PAYMENT');

        expect(orderEntry.amount).toBeGreaterThan(0);
        expect(paymentEntry.amount).toBeLessThan(0);
    });

    test('running balance starts at 0 and accumulates correctly across multiple entries', async () => {
        const order1 = makeSOROrderDoc({ totalAmount: 100, createdAt: new Date('2024-01-01'), orderNumber: 'ORD-001' });
        const order2 = makeSOROrderDoc({ totalAmount: 200, createdAt: new Date('2024-01-03'), orderNumber: 'ORD-002' });
        mockSOROrderFind([order1, order2]);

        const pay1 = makeSORPaymentDoc({ amount: 50, paymentDate: new Date('2024-01-02') });
        const pay2 = makeSORPaymentDoc({ amount: 100, paymentDate: new Date('2024-01-04') });
        SORPayment.find = jest.fn().mockResolvedValue([pay1, pay2]);

        const ledger = await getLedger(CUSTOMER_ID);

        // Chronological order: ORD-001 (Jan 1), pay1 (Jan 2), ORD-002 (Jan 3), pay2 (Jan 4)
        expect(ledger[0].runningBalance).toBe(100);   // +100
        expect(ledger[1].runningBalance).toBe(50);    // -50
        expect(ledger[2].runningBalance).toBe(250);  // +200
        expect(ledger[3].runningBalance).toBe(150);  // -100
    });

    test('ledger reference is order number for ORDER entries', async () => {
        const order = makeSOROrderDoc({ totalAmount: 300, createdAt: new Date('2024-02-01'), orderNumber: 'ORD-007' });
        mockSOROrderFind([order]);
        SORPayment.find = jest.fn().mockResolvedValue([]);

        const ledger = await getLedger(CUSTOMER_ID);

        expect(ledger[0].reference).toBe('ORD-007');
    });

    test('ledger reference is referenceNote for PAYMENT entries', async () => {
        mockSOROrderFind([]);
        const payment = makeSORPaymentDoc({ amount: 100, paymentDate: new Date('2024-02-01'), referenceNote: 'Bank transfer' });
        SORPayment.find = jest.fn().mockResolvedValue([payment]);

        const ledger = await getLedger(CUSTOMER_ID);

        expect(ledger[0].reference).toBe('Bank transfer');
    });
});
