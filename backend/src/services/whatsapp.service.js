const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1012170365-alpha.html'
            }
        });

        this.initialized = false;
        this.adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+2347078106382';
    }

    initialize() {
        console.log('[WhatsApp] Initializing...');

        this.client.on('qr', (qr) => {
            console.log('[WhatsApp] Scan this QR code to login:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('[WhatsApp] Client is ready!');
            this.initialized = true;
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WhatsApp] Auth failure:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('[WhatsApp] Disconnected:', reason);
            this.initialized = false;
        });

        this.client.initialize();
    }

    /**
     * Send order confirmation message to Admin
     * @param {Object} order - The order object with populated customer and items
     */
    async sendOrderConfirmation(order) {
        try {
            if (!this.initialized) {
                console.warn('[WhatsApp] Service not initialized. Message skipped.');
                return;
            }

            // In whatsapp-web.js, numbers must be in the format '2347078106382@c.us'
            // We strip any '+' and ensure the suffix is there.
            const formattedAdmin = this.adminNumber.replace('+', '') + '@c.us';

            const itemsList = order.items
                .map(item => `- ${item.product.name}: ${item.quantity} units`)
                .join('\n');

            const message = `
*Customer Details:*
- Name: ${order.customer.name}
- Phone: ${order.customer.phone || 'N/A'}
- Address: ${order.customer.address}

*Order Details:*
${itemsList}
            `.trim();

            await this.client.sendMessage(formattedAdmin, message, { sendSeen: false });
            console.log(`[WhatsApp] Notification sent to Admin: ${this.adminNumber}`);

            return { success: true };
        } catch (error) {
            if (error.message.includes('markedUnread')) {
                console.warn('[WhatsApp] Ignored markedUnread error, message might have been sent anyway.');
                return { success: true }; // Assume success if it's just the seen-status failing
            }
            console.error('[WhatsApp] Error sending message:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export a singleton instance
module.exports = new WhatsAppService();
