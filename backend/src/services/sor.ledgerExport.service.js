const { getLedger } = require('./sor.paymentTracker.service');

/**
 * Escapes a CSV field value — wraps in quotes if it contains commas, newlines, or quotes.
 * @param {*} value
 * @returns {string}
 */
function escapeCSVField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Exports the SOR ledger for a customer as a CSV string.
 *
 * Columns: Date, Type, Reference, Amount, Running Balance
 *
 * @param {string|ObjectId} customerId
 * @returns {Promise<string>} CSV string
 */
async function exportCSV(customerId) {
    const entries = await getLedger(customerId);

    const headers = ['Date', 'Type', 'Reference', 'Amount', 'Running Balance'];

    const rows = entries.map(entry => {
        const date = entry.date ? new Date(entry.date).toISOString().split('T')[0] : '';
        return [
            escapeCSVField(date),
            escapeCSVField(entry.type),
            escapeCSVField(entry.reference),
            escapeCSVField(entry.amount),
            escapeCSVField(entry.runningBalance),
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}

module.exports = { exportCSV };
