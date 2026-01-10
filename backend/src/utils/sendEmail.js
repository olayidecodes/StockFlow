const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create test account for dev (if no real SMTP provided)
    // In production, you would use options from .env

    let transporter;

    if (process.env.NODE_ENV === 'production') {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Dev: Use Ethereal
        // Check if we have ethereal creds cached or just create new ones
        // Creating new ones for every email is slow, but fine for dev testing single flow
        const testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'StockFlow'} <${process.env.FROM_EMAIL || 'noreply@stockflow.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);

    // Preview only available when sending through an Ethereal account
    if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL: %s', previewUrl);
        // Also log the code explicitly for easier access if the URL is hard to open
        console.log('--------------------------------------------------');
        console.log(`[DEV FALLBACK] If email fails, the code is in the message body.`);
        console.log('--------------------------------------------------');
    }
};

module.exports = sendEmail;
