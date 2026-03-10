import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"AddA" <${process.env.EMAIL_FROM || 'noreply@adda.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  const message = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail({
    email,
    subject: 'AddA - Password Reset Request',
    html: message
  });
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  const message = `
    <h1>Welcome to AddA!</h1>
    <p>Hi ${name},</p>
    <p>Welcome to AddA - your new favorite chat application!</p>
    <p>Start connecting with friends and sharing moments.</p>
  `;

  return sendEmail({
    email,
    subject: 'Welcome to AddA!',
    html: message
  });
};

// Send friend request email
export const sendFriendRequestEmail = async (email, requesterName) => {
  const message = `
    <h1>New Friend Request!</h1>
    <p>${requesterName} sent you a friend request on AddA.</p>
    <p>Login to accept or decline this request.</p>
  `;

  return sendEmail({
    email,
    subject: 'AddA - New Friend Request',
    html: message
  });
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service configured');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};