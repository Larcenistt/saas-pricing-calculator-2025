import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'SaaS Pricing Calculator <noreply@predictionnexus.com>',
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`, { messageId: info.messageId });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SaaS Pricing Calculator!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 SaaS Pricing Calculator. All rights reserved.</p>
              <p>Questions? Contact us at support@predictionnexus.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to SaaS Pricing Calculator!
      
      Please verify your email address by clicking the following link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - SaaS Pricing Calculator',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 SaaS Pricing Calculator. All rights reserved.</p>
              <p>Questions? Contact us at support@predictionnexus.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      We received a request to reset your password. Click the following link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset - SaaS Pricing Calculator',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { margin: 15px 0; padding-left: 25px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SaaS Pricing Calculator!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name || 'there'},</h2>
              <p>Your account has been successfully verified! You're now ready to optimize your SaaS pricing and unlock your revenue potential.</p>
              
              <h3>Here's what you can do:</h3>
              <div class="feature">✅ Calculate optimal pricing tiers</div>
              <div class="feature">✅ Analyze competitor pricing</div>
              <div class="feature">✅ Generate professional PDF reports</div>
              <div class="feature">✅ Save and compare scenarios</div>
              <div class="feature">✅ Collaborate with your team</div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/calculator" class="button">Start Calculating</a>
              </div>
              
              <h3>Need Help?</h3>
              <p>Check out our <a href="${process.env.FRONTEND_URL}/resources">resources page</a> for guides and tutorials, or reply to this email for support.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 SaaS Pricing Calculator. All rights reserved.</p>
              <p>Questions? Contact us at support@predictionnexus.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to SaaS Pricing Calculator! 🎉',
      html,
    });
  }

  async sendTeamInviteEmail(email: string, teamName: string, inviterName: string, inviteToken: string): Promise<void> {
    const inviteUrl = `${process.env.FRONTEND_URL}/team/join/${inviteToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
            </div>
            <div class="content">
              <h2>You're invited to join ${teamName}!</h2>
              <p>${inviterName} has invited you to collaborate on SaaS pricing calculations.</p>
              <p>Join the team to:</p>
              <ul>
                <li>Share and collaborate on pricing calculations</li>
                <li>Access team insights and reports</li>
                <li>Work together on pricing strategies</li>
              </ul>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Join Team</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 SaaS Pricing Calculator. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `${inviterName} invited you to join ${teamName}`,
      html,
    });
  }
}