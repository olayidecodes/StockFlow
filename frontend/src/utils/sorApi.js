import api from './api';

// ─── Customers ───────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, searchable list of SOR customers.
 * @param {{ search?: string, page?: number, limit?: number }} [params]
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getCustomers = (params) => api.get('/sor/customers', { params });

/**
 * Create a new SOR customer.
 * @param {{ name: string, phone?: string, address?: string }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const createCustomer = (data) => api.post('/sor/customers', data);

/**
 * Fetch a single SOR customer by ID.
 * @param {string} id - Customer ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getCustomer = (id) => api.get(`/sor/customers/${id}`);

/**
 * Update an existing SOR customer.
 * @param {string} id - Customer ID
 * @param {{ name?: string, phone?: string, address?: string }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const updateCustomer = (id, data) => api.put(`/sor/customers/${id}`, data);

/**
 * Delete an SOR customer (Admin only). Fails if customer has orders or payments.
 * @param {string} id - Customer ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const deleteCustomer = (id) => api.delete(`/sor/customers/${id}`);

/**
 * Fetch the chronological ledger for a customer with running balance.
 * @param {string} id - Customer ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getCustomerLedger = (id) => api.get(`/sor/customers/${id}/ledger`);

/**
 * Export the customer ledger as a file download.
 * @param {string} id - Customer ID
 * @param {'csv'} [format='csv'] - Export format
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const exportCustomerLedger = (id, format = 'csv') =>
    api.get(`/sor/customers/${id}/ledger/export`, { params: { format }, responseType: 'blob' });

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * Fetch all templates for a given customer.
 * @param {string} customerId - Customer ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getTemplates = (customerId) => api.get('/sor/templates', { params: { customer: customerId } });

/**
 * Create a new SOR template.
 * @param {{ customer: string, name: string, items: Array }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const createTemplate = (data) => api.post('/sor/templates', data);

/**
 * Update an existing SOR template.
 * @param {string} id - Template ID
 * @param {{ name?: string, items?: Array }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const updateTemplate = (id, data) => api.put(`/sor/templates/${id}`, data);

/**
 * Delete an SOR template.
 * @param {string} id - Template ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const deleteTemplate = (id) => api.delete(`/sor/templates/${id}`);

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Fetch SOR orders, optionally filtered by customer.
 * @param {{ customer?: string }} [params]
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getSOROrders = (params) => api.get('/sor/orders', { params });

/**
 * Create a new SOR order (also creates a standard Order document).
 * @param {{ customer: string, items: Array, notes?: string }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const createSOROrder = (data) => api.post('/sor/orders', data);

// ─── Payments ────────────────────────────────────────────────────────────────

/**
 * Fetch payments for a given customer, ordered by date descending.
 * @param {string} customerId - Customer ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getPayments = (customerId) => api.get('/sor/payments', { params: { customer: customerId } });

/**
 * Record a payment for an SOR customer.
 * Pass `confirmed: true` to bypass the overpayment warning on a second call.
 * @param {{ customer: string, amount: number, paymentDate?: string, notes?: string, confirmed?: boolean }} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const recordPayment = (data) => api.post('/sor/payments', data);

/**
 * Delete a payment record (Admin only).
 * @param {string} id - Payment ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const deletePayment = (id) => api.delete(`/sor/payments/${id}`);

// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * Fetch SOR dashboard stats: active customers, total liability, payments in range,
 * ranked customer list, and overdue orders.
 * @param {{ startDate?: string, endDate?: string }} [params]
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getDashboard = (params) => api.get('/sor/dashboard', { params });
