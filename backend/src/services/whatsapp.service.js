const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

/**
 * WhatsApp Service using Baileys
 * Lightweight WhatsApp Web API - No Puppeteer, No Cloud API setup
 * Direct WebSocket connection to WhatsApp
 */
class WhatsAppService {
    constructor() {
        this.sock = null;
        this.initialized = false;
        this.adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
        this.authFolder = path.join(__dirname, '../../.baileys_auth');
        this.isConnecting = false;
    }

    /**
     * Initialize WhatsApp connection
     */
    async initialize() {
        if (this.isConnecting) {
            console.log('[WhatsApp/Baileys] Already connecting...');
            return;
        }

        this.isConnecting = true;
        console.log('[WhatsApp/Baileys] Initializing...');

        try {
            // Load auth state from folder
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

            // Get latest Baileys version
            const { version } = await fetchLatestBaileysVersion();

            // Create socket connection
            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ['StockFlow', 'Chrome', '10.0'],
                defaultQueryTimeoutMs: 60000,
            });

            // Save credentials whenever they update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log('\n[WhatsApp/Baileys] QR Code generated!');
                    console.log('[WhatsApp/Baileys] Scan it with your WhatsApp app:');
                    require('qrcode-terminal').generate(qr, { small: true });
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                    console.log('[WhatsApp/Baileys] Connection closed. Reconnecting:', shouldReconnect);

                    if (shouldReconnect) {
                        this.initialized = false;
                        this.isConnecting = false;
                        // Reconnect after 5 seconds
                        setTimeout(() => this.initialize(), 5000);
                    } else {
                        console.log('[WhatsApp/Baileys] Logged out. Please restart server to reconnect.');
                        this.initialized = false;
                        this.isConnecting = false;
                    }
                } else if (connection === 'open') {
                    console.log('[WhatsApp/Baileys] ✅ Connected successfully!');
                    this.initialized = true;
                    this.isConnecting = false;
                }
            });

            // Handle messages (optional - for receiving messages)
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type === 'notify') {
                    // You can handle incoming messages here if needed
                    console.log('[WhatsApp/Baileys] New message received');
                }
            });

        } catch (error) {
            console.error('[WhatsApp/Baileys] Initialization error:', error.message);
            this.initialized = false;
            this.isConnecting = false;
        }
    }

    /**
     * Format phone number for WhatsApp (JID format)
     * Converts +2347078106382 to 2347078106382@s.whatsapp.net
     * @param {string} phoneNumber - Phone number with country code
     * @returns {string} - Formatted JID
     */
    formatPhoneNumber(phoneNumber) {
        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        // Return in WhatsApp JID format
        return `${cleaned}@s.whatsapp.net`;
    }

    /**
     * Send a text message
     * @param {string} to - Recipient phone number (with country code)
     * @param {string} message - Message text
     * @returns {Promise<Object>} - Result
     */
    async sendMessage(to, message) {
        try {
            if (!this.initialized || !this.sock) {
                console.warn('[WhatsApp/Baileys] Not connected. Message skipped.');
                return { success: false, error: 'Not connected to WhatsApp' };
            }

            const jid = this.formatPhoneNumber(to);

            // Send message
            await this.sock.sendMessage(jid, { text: message });

            console.log(`[WhatsApp/Baileys] ✅ Message sent to ${to}`);
            return { success: true };
        } catch (error) {
            console.error('[WhatsApp/Baileys] Error sending message:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order confirmation message to Admin
     * @param {Object} order - The order object with populated customer and items
     */
    async sendOrderConfirmation(order) {
        try {
            if (!this.initialized || !this.sock) {
                console.warn('[WhatsApp/Baileys] Not connected. Message skipped.');
                return { success: false, error: 'Not connected to WhatsApp' };
            }

            // Build the items list
            const itemsList = order.items
                .map(item => `• ${item.product.name}: ${item.quantity} units`)
                .join('\n');

            // Format message (WhatsApp supports basic markdown)
            const message = `🔔 *New Order Confirmation*

📋 *Customer Details:*
Name: ${order.customer.name}
Phone: ${order.customer.phone || 'N/A'}
Address: ${order.customer.address}

📦 *Order Items:*
${itemsList}
`;

            // Send to admin
            const result = await this.sendMessage(this.adminNumber, message);

            if (result.success) {
                console.log(`[WhatsApp/Baileys] Order confirmation sent to Admin: ${this.adminNumber}`);
            }

            return result;
        } catch (error) {
            console.error('[WhatsApp/Baileys] Error sending order confirmation:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send image with caption
     * @param {string} to - Recipient phone number
     * @param {Buffer|string} image - Image buffer or URL
     * @param {string} caption - Image caption
     */
    async sendImage(to, image, caption = '') {
        try {
            if (!this.initialized || !this.sock) {
                console.warn('[WhatsApp/Baileys] Not connected. Message skipped.');
                return { success: false, error: 'Not connected to WhatsApp' };
            }

            const jid = this.formatPhoneNumber(to);

            await this.sock.sendMessage(jid, {
                image: typeof image === 'string' ? { url: image } : image,
                caption: caption
            });

            console.log(`[WhatsApp/Baileys] ✅ Image sent to ${to}`);
            return { success: true };
        } catch (error) {
            console.error('[WhatsApp/Baileys] Error sending image:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if a number is registered on WhatsApp
     * @param {string} phoneNumber - Phone number to check
     * @returns {Promise<boolean>} - True if registered
     */
    async isRegistered(phoneNumber) {
        try {
            if (!this.initialized || !this.sock) {
                return false;
            }

            const jid = this.formatPhoneNumber(phoneNumber);
            const [result] = await this.sock.onWhatsApp(jid);

            return result?.exists || false;
        } catch (error) {
            console.error('[WhatsApp/Baileys] Error checking registration:', error.message);
            return false;
        }
    }

    /**
     * Gracefully disconnect
     */
    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.initialized = false;
            console.log('[WhatsApp/Baileys] Disconnected');
        }
    }
}

// Export a singleton instance
module.exports = new WhatsAppService();
