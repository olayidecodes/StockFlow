const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test Users
const users = [
    { email: 'admin@test.com', password: 'password123', role: 'ADMIN' },
    { email: 'manager@test.com', password: 'password123', role: 'INVENTORY_MANAGER' },
    { email: 'sales@test.com', password: 'password123', role: 'SALES' },
    { email: 'viewer@test.com', password: 'password123', role: 'VIEWER' }
];

const endpoints = [
    { url: '/test/admin-only', label: 'Admin Only (MANAGE_USERS)', expected: ['ADMIN'] },
    { url: '/test/inventory/manage', label: 'Inventory (MANAGE_INVENTORY)', expected: ['ADMIN', 'INVENTORY_MANAGER'] },
    { url: '/test/orders/create', label: 'Sales (CREATE_ORDERS)', expected: ['ADMIN', 'INVENTORY_MANAGER', 'SALES'] },
    { url: '/test/viewer-access', label: 'Viewer (VIEW_*)', expected: ['ADMIN', 'INVENTORY_MANAGER', 'SALES', 'VIEWER'] }
];

async function getAuthToken(user) {
    try {
        // Try to register
        await axios.post(`${API_URL}/auth/register`, user);
    } catch (err) {
        // If exists, ignore
    }

    // Login
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: user.email,
            password: user.password
        });
        return res.data.data.token;
    } catch (err) {
        console.error(`Failed to login ${user.role}:`, err.message);
        return null;
    }
}

async function runTests() {
    console.log('Starting Role Verification...\n');

    const tokens = {};

    // 1. Authenticate all users
    for (const user of users) {
        console.log(`Authenticating ${user.role}...`);
        const token = await getAuthToken(user);
        if (token) tokens[user.role] = token;
    }

    console.log('\n--- Testing Endpoints ---\n');

    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint.label}...`);

        for (const [role, token] of Object.entries(tokens)) {
            try {
                await axios.get(`${API_URL}${endpoint.url}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const shouldSucceed = endpoint.expected.includes(role);
                if (shouldSucceed) {
                    console.log(`  ✅ ${role}: Success (Expected)`);
                } else {
                    console.log(`  ❌ ${role}: Success (UNEXPECTED - Should Fail)`);
                }
            } catch (err) {
                const shouldFail = !endpoint.expected.includes(role);
                if (shouldFail && err.response && err.response.status === 403) {
                    console.log(`  ✅ ${role}: 403 Forbidden (Expected)`);
                } else {
                    console.log(`  ❌ ${role}: Failed with ${err.response ? err.response.status : err.message} (UNEXPECTED)`);
                }
            }
        }
        console.log('');
    }
}

runTests();
