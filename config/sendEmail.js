import nodemailer from 'nodemailer';

// Create transporter 
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS 
    }
});

// Verify transporter connection   
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

// Email sending function
export const sendEmail = async ({ sendTo, subject, html, text }) => {
    try {
        const mailOptions = {
            from: {
                name: process.env.SMTP_FROM_NAME || 'Jubian Market',
                address: process.env.SMTP_FROM_EMAIL || 'siremms300@gmail.com'
            },
            to: sendTo,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '') // Fallback text version
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${sendTo}, Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
};

// Email templates
export const verifyEmailTemplate = ({ name, url }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Jubian Market! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button" style="color: #f5f0f0;">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${url}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Jubian Market. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = ({ name, url }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #dc3545; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
        .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Jubian Market account.</p>
            
            <div class="warning">
                <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${url}</p>
            
            <p><strong>This password reset link will expire in 1 hour.</strong></p>
            
            <p>For security reasons, we recommend that you:</p>
            <ul>
                <li>Choose a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Enable two-factor authentication if available</li>
            </ul>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Jubian Market. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Additional template for general notifications
export const welcomeEmailTemplate = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Jubian Market!</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to Jubian Market! We're excited to have you on board.</p>
            <p>Your account has been successfully created and is ready to use.</p>
            
            <p>Here's what you can do now:</p>
            <ul>
                <li>Browse our products and services</li>
                <li>Complete your profile</li>
                <li>Start shopping!</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Happy shopping!</p>
            <p><strong>The Jubian Market Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Jubian Market. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Test email function
export const testEmail = async () => {
    try {
        await sendEmail({
            sendTo: process.env.SMTP_TEST_EMAIL,
            subject: 'Test Email from Jubian Market',
            html: '<h1>Test Email</h1><p>This is a test email from Jubian Market server.</p>'
        });
        console.log('Test email sent successfully');
    } catch (error) {
        console.error('Test email failed:', error);
    }
};

export default {
    sendEmail,
    verifyEmailTemplate,
    passwordResetTemplate,
    welcomeEmailTemplate,
    testEmail
};