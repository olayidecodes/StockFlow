'use strict';

// Stub for @whiskeysockets/baileys — used in Jest tests to avoid ESM parse errors.
// The WhatsApp service is always mocked in tests, so this stub is never called.

module.exports = {
    default: jest.fn(),
    makeWASocket: jest.fn(),
    DisconnectReason: {},
    useMultiFileAuthState: jest.fn().mockResolvedValue({ state: {}, saveCreds: jest.fn() }),
    fetchLatestBaileysVersion: jest.fn().mockResolvedValue({ version: [2, 0, 0] }),
};
