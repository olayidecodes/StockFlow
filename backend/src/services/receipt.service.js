const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Receipt Generation Service
 * Generates professional PDF receipts for orders
 */
class ReceiptService {
    constructor() {
        // Ensure receipts directory exists
        this.receiptsDir = path.join(__dirname, '../../receipts');
        if (!fs.existsSync(this.receiptsDir)) {
            fs.mkdirSync(this.receiptsDir, { recursive: true });
        }
    }

    /**
     * Generate a PDF receipt for an order
     * @param {Object} order - Populated order object
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateReceipt(order) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `receipt-${order._id}.pdf`;
                const filePath = path.join(this.receiptsDir, fileName);

                // Create PDF document
                const doc = new PDFDocument({ 
                    size: 'A4', 
                    margin: 50,
                    info: {
                        Title: `Receipt - Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
                        Author: 'StockFlow',
                        Subject: 'Order Receipt'
                    }
                });

                // Pipe to file
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Header
                this.addHeader(doc, order);
                
                // Customer Info
                this.addCustomerInfo(doc, order);
                
                // Order Details
                this.addOrderDetails(doc, order);
                
                // Items Table
                this.addItemsTable(doc, order);
                
                // Payment Summary
                this.addPaymentSummary(doc, order);
                
                // Footer
                this.addFooter(doc);

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    console.log(`[Receipt] Generated: ${fileName}`);
                    resolve(filePath);
                });

                stream.on('error', (err) => {
                    console.error('[Receipt] Generation error:', err);
                    reject(err);
                });

            } catch (error) {
                console.error('[Receipt] Error:', error);
                reject(error);
            }
        });
    }

    addHeader(doc, order) {
        
        // Receipt Title
        doc.moveDown(1.5);
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('ORDER RECEIPT', { align: 'center' });
        
        // // Order Number
        // doc.moveDown(0.5);
        // doc.fontSize(12)
        //    .font('Helvetica')
        //    .text(`Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`, { align: 'center' });
        
        // Date
        doc.fontSize(10)
           .text(new Date(order.createdAt).toLocaleDateString('en-US', {
               weekday: 'long',
               year: 'numeric',
               month: 'long',
               day: 'numeric'
           }), { align: 'center' });
        
        // Status Badge
        doc.moveDown(0.5);
        const statusColor = order.status === 'CONFIRMED' ? '#10B981' : 
                           order.status === 'CANCELLED' ? '#EF4444' : '#F59E0B';
        doc.fontSize(10)
           .fillColor(statusColor)
           .text(`Status: ${order.status}`, { align: 'center' })
           .fillColor('#000000');
        
        doc.moveDown(1);
        
        // Horizontal line
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .stroke();
        
        doc.moveDown(1);
    }

    addCustomerInfo(doc, order) {
        const startY = doc.y;
        
        // Left column - Customer Info
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('CUSTOMER INFORMATION', 50, startY);
        
        doc.fontSize(10)
           .font('Helvetica')
           .moveDown(0.3);
        
        doc.text(`Name: ${order.customer?.name || 'N/A'}`, 50);
        doc.text(`Address: ${order.customer?.address || 'N/A'}`, 50);
        doc.text(`Phone: ${order.customer?.phone || 'N/A'}`, 50);
        doc.text(`Email: ${order.customer?.email || 'N/A'}`, 50);
        
        // Right column - Order Info
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('ORDER INFORMATION', 320, startY);
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Warehouse: ${order.warehouse?.name || 'N/A'}`, 320, startY + 25);
        doc.text(`Region: ${order.region?.name || 'N/A'}`, 320);
        doc.text(`Channel: ${order.channel || 'N/A'}`, 320);
        
        doc.moveDown(1.5);
        
        // Horizontal line
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .stroke();
        
        doc.moveDown(1);
    }

    addOrderDetails(doc, order) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('ORDER ITEMS', 50);
        
        doc.moveDown(0.5);
    }

    addItemsTable(doc, order) {
        const tableTop = doc.y;
        const itemHeight = 25;
        
        // Table headers
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#64748B');
        
        doc.text('PRODUCT', 50, tableTop);
        doc.text('SKU', 200, tableTop);
        doc.text('QTY', 300, tableTop, { width: 60, align: 'right' });
        doc.text('UNIT PRICE', 370, tableTop, { width: 80, align: 'right' });
        doc.text('SUBTOTAL', 460, tableTop, { width: 85, align: 'right' });
        
        // Line under headers
        doc.moveTo(50, tableTop + 15)
           .lineTo(545, tableTop + 15)
           .strokeColor('#E2E8F0')
           .stroke();
        
        // Items
        let currentY = tableTop + 25;
        doc.fillColor('#000000')
           .font('Helvetica');
        
        order.items.forEach((item, index) => {
            const cartonSize = item.product?.cartonSize || 1;
            const cartons = Math.floor(item.quantity / cartonSize);
            const pieces = item.quantity % cartonSize;
            const subtotal = item.quantity * (item.price || 0);
            
            // Check if we need a new page
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
            
            // Product name (truncate if too long)
            const productName = (item.product?.name || 'Unknown').substring(0, 30);
            doc.fontSize(9)
               .text(productName, 50, currentY, { width: 140 });
            
            // SKU
            doc.text(item.product?.sku || 'N/A', 200, currentY, { width: 90 });
            
            // Quantity
            const qtyText = cartonSize > 1 
                ? `${item.quantity}\n(${cartons}c, ${pieces}p)`
                : `${item.quantity}`;
            doc.text(qtyText, 300, currentY, { width: 60, align: 'right' });
            
            // Unit Price
            doc.text(`NGN ${(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     370, currentY, { width: 80, align: 'right' });
            
            // Subtotal
            doc.text(`NGN ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     460, currentY, { width: 85, align: 'right' });
            
            currentY += itemHeight + (cartonSize > 1 ? 10 : 0);
            
            // Light separator line
            if (index < order.items.length - 1) {
                doc.moveTo(50, currentY - 5)
                   .lineTo(545, currentY - 5)
                   .strokeColor('#F1F5F9')
                   .stroke();
            }
        });
        
        doc.y = currentY + 10;
    }

    addPaymentSummary(doc, order) {
        // Line before summary
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#E2E8F0')
           .stroke();
        
        doc.moveDown(0.5);
        
        const summaryX = 370;
        const valueX = 460;
        
        doc.fontSize(10)
           .font('Helvetica');
        
        // Subtotal (if discount exists)
        if (order.discountAmount > 0) {
            doc.text('Subtotal:', summaryX, doc.y);
            doc.text(`NGN ${(order.subtotal || (order.totalAmount + order.discountAmount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     valueX, doc.y, { width: 85, align: 'right' });
            
            doc.moveDown(0.5);
            
            // Discount
            doc.fillColor('#EF4444')
               .text('Discount:', summaryX, doc.y);
            doc.text(`-NGN ${order.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     valueX, doc.y, { width: 85, align: 'right' })
               .fillColor('#000000');
            
            doc.moveDown(0.5);
        }
        
        // Total line
        doc.moveTo(370, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#1E293B')
           .lineWidth(2)
           .stroke()
           .lineWidth(1);
        
        doc.moveDown(0.3);
        
        // Total Amount
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TOTAL AMOUNT:', summaryX, doc.y);
        doc.fillColor('#4880FF')
           .text(`NGN ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                 valueX, doc.y, { width: 85, align: 'right' })
           .fillColor('#000000');
        
        doc.moveDown(1);
    }

    addFooter(doc) {
        // Move to bottom of page
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#64748B');
        
        const footerY = 750;
        
        doc.moveTo(50, footerY - 10)
           .lineTo(545, footerY - 10)
           .strokeColor('#E2E8F0')
           .stroke();
        
        doc.text('Thank you for your business!', 50, footerY, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 12, { align: 'center' });
        doc.text('StockFlow', 50, footerY + 24, { align: 'center' });
    }

    /**
     * Get receipt file path for an order
     * @param {string} orderId - Order ID
     * @returns {string} - File path
     */
    getReceiptPath(orderId) {
        return path.join(this.receiptsDir, `receipt-${orderId}.pdf`);
    }

    /**
     * Check if receipt exists for an order
     * @param {string} orderId - Order ID
     * @returns {boolean}
     */
    receiptExists(orderId) {
        return fs.existsSync(this.getReceiptPath(orderId));
    }

    /**
     * Delete receipt for an order
     * @param {string} orderId - Order ID
     */
    deleteReceipt(orderId) {
        const filePath = this.getReceiptPath(orderId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Receipt] Deleted: receipt-${orderId}.pdf`);
        }
    }
}

// Export singleton instance
module.exports = new ReceiptService();
