const fs = require('fs');
const path = require('path');

/**
 * Clear all generated receipts and invoices
 * Run this script when you make changes to the receipt/invoice templates
 * to force regeneration of all PDFs
 */

const receiptsDir = path.join(__dirname, 'receipts');
const invoicesDir = path.join(__dirname, 'invoices');

let totalCleared = 0;

// Clear receipts
if (fs.existsSync(receiptsDir)) {
    const files = fs.readdirSync(receiptsDir);
    
    files.forEach(file => {
        if (file.endsWith('.pdf')) {
            fs.unlinkSync(path.join(receiptsDir, file));
            console.log(`Deleted receipt: ${file}`);
            totalCleared++;
        }
    });
} else {
    console.log('Receipts directory does not exist.');
}

// Clear invoices
if (fs.existsSync(invoicesDir)) {
    const files = fs.readdirSync(invoicesDir);
    
    files.forEach(file => {
        if (file.endsWith('.pdf')) {
            fs.unlinkSync(path.join(invoicesDir, file));
            console.log(`Deleted invoice: ${file}`);
            totalCleared++;
        }
    });
} else {
    console.log('Invoices directory does not exist.');
}

console.log(`\nCleared ${totalCleared} PDF(s) total`);
console.log('All PDFs will be regenerated with the latest template on next download.');

