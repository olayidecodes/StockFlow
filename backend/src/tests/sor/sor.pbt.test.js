// Feature: sales-on-return
// Property-Based Tests using fast-check
// Each property runs a minimum of 100 iterations.

'use strict';

jest.mock('../../models/SOROrder');
jest.mock('../../models/SORPayment');
jest.mock('../../models/SORCustomer');
jest.mock('../../models/SORTemplate');

const fc = require('fast-check');
const mongoose = require('mongoose');

const SOROrder = require('../../models/SOROrder');
const SORPayment = require('../../models/SORPayment');
const SORCustomer = require('../../models/SORCustomer');
const SORTemplate = require('../../models/SORTemplate');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CUSTOMER_ID = new mongoose.Types.ObjectId().toString();

/** Build a minimal Express-style mock req/res pair */
function makeReqRes(body = {}, query = {}, params = {}, user = { id: new mongoose.Types.ObjectId().toString(), role: 'SALES' }) {
    const req = { body, query, params, user };
    const res = {
        _status: null,
        _json: null,
        _body: null,
        status(code) { this._status = code; return this; },
        json(data) { this._json = data; return this; },
        send(data) { this._body = data; return this; },
        setHeader: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
}

// Use integer-based amounts (in cents) to avoid floating-point precision issues.
// 1 unit = 1 cent. Range: 1 cent to $10,000.
const amountArb = fc.integer({ min: 1, max: 1_000_000 });

// Non-empty string arbitrary (avoids whitespace-only strings)
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// ---------------------------------------------------------------------------
// 16.4 — P_FORMULA: liability = sum(confirmed) - sum(payments)
// Feature: sales-on-return, Property 11: Liability Formula Consistency
// ---------------------------------------------------------------------------

describe('P_FORMULA: liability = sum(confirmed orders) - sum(payments)', () => {
    const { computeLiability } = require('../../services/sor.paymentTracker.service');

    afterEach(() => jest.clearAllMocks());

    test('holds for any combination of confirmed order amounts and payment amounts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(amountArb, { minLength: 0, maxLength: 20 }),
                fc.array(amountArb, { minLength: 0, maxLength: 20 }),
                async (confirmedAmounts, paymentAmounts) => {
                    const confirmedTotal = confirmedAmounts.reduce((s, a) => s + a, 0);
                    const paymentsTotal = paymentAmounts.reduce((s, a) => s + a, 0);

                    SOROrder.aggregate.mockResolvedValue(
                        confirmedTotal > 0 ? [{ _id: null, total: confirmedTotal }] : []
                    );
                    SORPayment.aggregate.mockResolvedValue(
                        paymentsTotal > 0 ? [{ _id: null, total: paymentsTotal }] : []
                    );

                    const result = await computeLiability(CUSTOMER_ID);

                    expect(result.outstandingLiability).toBe(confirmedTotal - paymentsTotal);
                    expect(result.confirmedOrdersTotal).toBe(confirmedTotal);
                    expect(result.paymentsTotal).toBe(paymentsTotal);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('liability is zero when no orders and no payments', async () => {
        await fc.assert(
            fc.asyncProperty(fc.constant(null), async () => {
                SOROrder.aggregate.mockResolvedValue([]);
                SORPayment.aggregate.mockResolvedValue([]);

                const result = await computeLiability(CUSTOMER_ID);
                expect(result.outstandingLiability).toBe(0);
            }),
            { numRuns: 1 }
        );
    });
});
