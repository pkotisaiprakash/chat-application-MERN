const nodemailer = require("nodemailer");

// Create reusable transporter
let transporter = null;

// Initialize transporter if email config exists
const initTransporter = () => {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        return true;
    }
    return false;
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    // Try to initialize transporter
    const hasEmailConfig = initTransporter();

    // In development, always log OTP to console
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 [DEV] Password Reset OTP for ${email}: ${otp}`);
    }

    if (!hasEmailConfig) {
        console.log("📧 Email not configured. OTP logged to console (development mode).");
        return { success: true, message: "OTP logged to console" };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Snappy Chat" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset OTP - Snappy Chat",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
                        .otp-box { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; }
                        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                        .warning { background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 12px; color: #856404; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🔔 Snappy Chat</div>
                        </div>
                        <p>Hello,</p>
                        <p>You requested a password reset for your Snappy Chat account.</p>
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0;">Your OTP is:</p>
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p>This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 15} minutes.</p>
                        <div class="warning">
                            ⚠️ If you didn't request this password reset, please ignore this email.
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Snappy Chat. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        console.log(`📧 OTP email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error sending email:", error);
        // Fall back to console logging
        console.log(`🔐 [FALLBACK] Password Reset OTP for ${email}: ${otp}`);
        return { success: true, message: "OTP logged to console due to email error" };
    }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, username) => {
    const hasEmailConfig = initTransporter();

    if (!hasEmailConfig) {
        console.log(`📧 [DEV] Welcome email for ${email} (username: ${username})`);
        return { success: true };
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Snappy Chat" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to Snappy Chat! 🎉",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
                        .content { padding: 20px 0; }
                        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
                        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🎉 Snappy Chat</div>
                        </div>
                        <div class="content">
                            <p>Welcome to Snappy Chat, <strong>${username}</strong>!</p>
                            <p>We're excited to have you join our community.</p>
                            <p>Start chatting with friends and family instantly!</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Snappy Chat. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error("❌ Error sending welcome email:", error);
        return { success: false, error };
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
};
