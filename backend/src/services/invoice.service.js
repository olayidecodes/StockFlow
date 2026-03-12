const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Invoice Generation Service
 * Generates professional PDF invoices for wholesale orders
 */
class InvoiceService {
    constructor() {
        // Ensure invoices directory exists
        this.invoicesDir = path.join(__dirname, '../../invoices');
        if (!fs.existsSync(this.invoicesDir)) {
            fs.mkdirSync(this.invoicesDir, { recursive: true });
        }
        
        // Company information
        this.companyInfo = {
            name: 'GidiGames',
            address: 'HANA PLAZA, 109 Awolowo Road, Ikoyi, Lagos',
            phone: '+2349091111666',
            email: 'gidiwords@gmail.com',
            website: 'gidigames.com.ng'
        };
    }

    /**
     * Generate a PDF invoice for a wholesale order
     * @param {Object} order - Populated order object
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateInvoice(order) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `invoice-${order._id}.pdf`;
                const filePath = path.join(this.invoicesDir, fileName);

                // Create PDF document
                const doc = new PDFDocument({ 
                    size: 'A4', 
                    margin: 50,
                    info: {
                        Title: `Invoice - Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
                        Author: 'GidiGames',
                        Subject: 'Wholesale Order Invoice'
                    }
                });

                // Pipe to file
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Company Header with Logo
                this.addCompanyHeader(doc);
                
                // Invoice Title and Details
                this.addInvoiceHeader(doc, order);
                
                // Customer Info
                this.addCustomerInfo(doc, order);
                
                // Items Table
                this.addItemsTable(doc, order);
                
                // Payment Summary with Delivery Fee
                this.addPaymentSummary(doc, order);
                
                // Payment Terms
                this.addPaymentTerms(doc);
                
                // Footer
                this.addFooter(doc);

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    console.log(`[Invoice] Generated: ${fileName}`);
                    resolve(filePath);
                });

                stream.on('error', (err) => {
                    console.error('[Invoice] Generation error:', err);
                    reject(err);
                });

            } catch (error) {
                console.error('[Invoice] Error:', error);
                reject(error);
            }
        });
    }

    addCompanyHeader(doc) {
        const logoX = 50;
        const logoY = 50;
        const logoSize = 60;
        const companyDetailsX = logoX + logoSize + 15; // Logo + spacing
        const rightColumnX = 380;
        const startY = 50;
        
        // Logo on the left
        const logoPath = path.join(__dirname, '../assets/logo.png');
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, logoX, logoY, { 
                    width: logoSize,
                    height: logoSize,
                    fit: [logoSize, logoSize]
                });
            } catch (err) {
                console.log('[Invoice] Logo not found or invalid, skipping');
            }
        }
        
        // Company Details (next to logo)
        // Company Name (Large and Bold)
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text(this.companyInfo.name, companyDetailsX, startY);
        
        // Company Address and Contact
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#64748B')
           .text(this.companyInfo.address, companyDetailsX, startY + 30)
           .text(`Phone: ${this.companyInfo.phone} | Email: ${this.companyInfo.email}`, companyDetailsX, startY + 43)
           .text(this.companyInfo.website, companyDetailsX, startY + 56);
        
        // Right side - INVOICE Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text('INVOICE', rightColumnX, startY, { align: 'right', width: 165 });
        
        // Horizontal line
        doc.moveTo(50, 125)
           .lineTo(545, 125)
           .strokeColor('#E2E8F0')
           .lineWidth(2)
           .stroke()
           .lineWidth(1);
        
        doc.moveDown(2);
    }

    addInvoiceHeader(doc, order) {
        const startY = 145;
        
        // Invoice details (no title since it's in the header now)
        const rightX = 380;
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#64748B')
           .text('Invoice Number:', rightX, startY, { width: 80 });
        doc.font('Helvetica')
           .fillColor('#1E293B')
           .text(`#${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`, rightX + 85, startY);
        
        doc.font('Helvetica-Bold')
           .fillColor('#64748B')
           .text('Invoice Date:', rightX, startY + 15, { width: 80 });
        doc.font('Helvetica')
           .fillColor('#1E293B')
           .text(new Date(order.createdAt).toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'short',
               day: 'numeric'
           }), rightX + 85, startY + 15);
        
        doc.font('Helvetica-Bold')
           .fillColor('#64748B')
           .text('Status:', rightX, startY + 30, { width: 80 });
        const statusColor = order.status === 'CONFIRMED' ? '#10B981' : 
                           order.status === 'CANCELLED' ? '#EF4444' : '#F59E0B';
        doc.font('Helvetica-Bold')
           .fillColor(statusColor)
           .text(order.status, rightX + 85, startY + 30);
        
        doc.y = startY + 60;
    }

    addCustomerInfo(doc, order) {
        const startY = doc.y;
        
        // Bill To section
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text('BILL TO:', 50, startY);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#1E293B');
        
        let currentY = startY + 20;
        
        // Customer Name
        doc.font('Helvetica-Bold')
           .text(order.customer?.name || 'N/A', 50, currentY);
        currentY += 15;
        
        // Address
        doc.font('Helvetica')
           .fillColor('#475569')
           .text(order.customer?.address || 'N/A', 50, currentY, { width: 250 });
        currentY = doc.y + 5;
        
        // Phone
        if (order.customer?.phone) {
            doc.text(`Phone: ${order.customer.phone}`, 50, currentY);
            currentY = doc.y + 5;
        }
        
        // Email
        if (order.customer?.email) {
            doc.fillColor('#4880FF')
               .text(`Email: ${order.customer.email}`, 50, currentY);
            currentY = doc.y;
        }
        
        // Ship To / Order Info (right side)
      //   const rightX = 320;
      //   doc.fontSize(11)
      //      .font('Helvetica-Bold')
      //      .fillColor('#1E293B')
      //      .text('ORDER INFORMATION:', rightX, startY);
        
      //   doc.fontSize(10)
      //      .font('Helvetica');
        
      //   let rightY = startY + 20;
        
      //   doc.fillColor('#64748B')
      //      .text('Warehouse:', rightX, rightY);
      //   doc.fillColor('#1E293B')
      //      .text(order.warehouse?.name || 'N/A', rightX + 70, rightY);
      //   rightY += 15;
        
      //   doc.fillColor('#64748B')
      //      .text('Region:', rightX, rightY);
      //   doc.fillColor('#1E293B')
      //      .text(order.region?.name || 'N/A', rightX + 70, rightY);
      //   rightY += 15;
        
      //   doc.fillColor('#64748B')
      //      .text('Order Type:', rightX, rightY);
      //   doc.fillColor('#4880FF')
      //      .font('Helvetica-Bold')
      //      .text(order.orderType || 'RETAIL', rightX + 70, rightY);
        
        doc.y = Math.max(currentY, rightY) + 25;
        
        // Horizontal line
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#E2E8F0')
           .stroke();
        
        doc.moveDown(1);
    }

    addItemsTable(doc, order) {
        const tableTop = doc.y;
        const itemHeight = 25;
        
        // Table headers with background
        doc.rect(50, tableTop, 495, 20)
           .fillColor('#F1F5F9')
           .fill();
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1E293B');
        
        doc.text('#', 55, tableTop + 6, { width: 20 });
        doc.text('PRODUCT', 80, tableTop + 6);
        doc.text('QTY', 300, tableTop + 6, { width: 80, align: 'right' });
        doc.text('UNIT PRICE', 390, tableTop + 6, { width: 80, align: 'right' });
        doc.text('AMOUNT', 480, tableTop + 6, { width: 60, align: 'right' });
        
        // Items
        let currentY = tableTop + 30;
        doc.fillColor('#000000')
           .font('Helvetica');
        
        order.items.forEach((item, index) => {
            const cartonSize = item.product?.cartonSize || 1;
            const cartons = Math.floor(item.quantity / cartonSize);
            const pieces = item.quantity % cartonSize;
            const subtotal = item.quantity * (item.price || 0);
            
            // Check if we need a new page
            if (currentY > 680) {
                doc.addPage();
                currentY = 50;
            }
            
            // Item number
            doc.fontSize(9)
               .text(`${index + 1}`, 55, currentY, { width: 20 });
            
            // Product name
            const productName = (item.product?.name || 'Unknown').substring(0, 40);
            doc.text(productName, 80, currentY, { width: 210 });
            
            // Quantity
            let qtyText;
            if (cartonSize > 1) {
                if (cartons > 0 && pieces > 0) {
                    qtyText = `${cartons} ctn, ${pieces} pcs`;
                } else if (cartons > 0) {
                    qtyText = `${cartons} ctn`;
                } else {
                    qtyText = `${pieces} pcs`;
                }
            } else {
                qtyText = `${item.quantity} pcs`;
            }
            doc.text(qtyText, 300, currentY, { width: 80, align: 'right' });
            
            // Unit Price
            doc.text(`NGN ${(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     390, currentY, { width: 80, align: 'right' });
            
            // Subtotal
            doc.text(`NGN ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     480, currentY, { width: 60, align: 'right' });
            
            currentY += itemHeight;
            
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
           .strokeColor('#1E293B')
           .lineWidth(1.5)
           .stroke()
           .lineWidth(1);
        
        doc.moveDown(0.5);
        
        const summaryX = 350;
        const labelX = summaryX;
        const valueX = 460;
        
        doc.fontSize(10)
           .font('Helvetica');
        
        // Subtotal
        const itemsSubtotal = order.items.reduce((acc, item) => acc + (item.quantity * (item.price || 0)), 0);
        doc.fillColor('#64748B')
           .text('Subtotal:', labelX, doc.y);
        doc.fillColor('#1E293B')
           .text(`NGN ${itemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                 valueX, doc.y, { width: 85, align: 'right' });
        
        doc.moveDown(0.5);
        
        // Discount (if applicable)
        if (order.discountAmount > 0) {
            doc.fillColor('#EF4444')
               .text('Discount:', labelX, doc.y);
            doc.text(`-NGN ${order.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     valueX, doc.y, { width: 85, align: 'right' });
            
            doc.moveDown(0.5);
        }
        
        // Delivery Fee
        if (order.deliveryFee > 0) {
            doc.fillColor('#64748B')
               .text('Delivery Fee:', labelX, doc.y);
            doc.fillColor('#1E293B')
               .text(`NGN ${order.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                     valueX, doc.y, { width: 85, align: 'right' });
            
            doc.moveDown(0.5);
        }
        
        // Total line
        doc.moveTo(350, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#1E293B')
           .lineWidth(2)
           .stroke()
           .lineWidth(1);
        
        doc.moveDown(0.3);
        
        // Total Amount
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text('TOTAL AMOUNT:', labelX, doc.y);
        doc.fontSize(14)
           .fillColor('#10B981')
           .text(`NGN ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                 valueX, doc.y, { width: 85, align: 'right' });
        
        doc.moveDown(1.5);
    }

    addPaymentTerms(doc) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text('Payment Terms:', 50, doc.y);
        
        doc.moveDown(0.3);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#64748B')
           .text('• Payment is due within 30 days of invoice date', 50, doc.y)
           .text('• Please include invoice number with payment', 50, doc.y + 12)
           .text('• Late payments may incur additional charges', 50, doc.y + 24);
        
        doc.moveDown(2);
    }

    addFooter(doc) {
        const footerY = 720;
        
        doc.moveTo(50, footerY)
           .lineTo(545, footerY)
           .strokeColor('#E2E8F0')
           .stroke();
        
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#64748B')
           .text('Thank you for your business!', 50, footerY + 10, { align: 'center' });
        
        doc.fontSize(7)
           .text(`${this.companyInfo.name} | ${this.companyInfo.phone} | ${this.companyInfo.email}`, 
                 50, footerY + 22, { align: 'center' });
        
        doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 32, { align: 'center' });
    }

    /**
     * Get invoice file path for an order
     * @param {string} orderId - Order ID
     * @returns {string} - File path
     */
    getInvoicePath(orderId) {
        return path.join(this.invoicesDir, `invoice-${orderId}.pdf`);
    }

    /**
     * Check if invoice exists for an order
     * @param {string} orderId - Order ID
     * @returns {boolean}
     */
    invoiceExists(orderId) {
        return fs.existsSync(this.getInvoicePath(orderId));
    }

    /**
     * Delete invoice for an order
     * @param {string} orderId - Order ID
     */
    deleteInvoice(orderId) {
        const filePath = this.getInvoicePath(orderId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Invoice] Deleted: invoice-${orderId}.pdf`);
        }
    }
}

// Export singleton instance
module.exports = new InvoiceService();
