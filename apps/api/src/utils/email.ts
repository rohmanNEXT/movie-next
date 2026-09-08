import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { SMTP_USER, SMTP_PASS, BASE_URL } from '@/config';

const FROM_ADDRESS = `"Chill Movie" <${SMTP_USER || 'noreply@chillmovie.com'}>`;

// Use Ethereal for testing if no SMTP credentials provided
let transporter: nodemailer.Transporter;

if (!SMTP_USER || !SMTP_PASS) {
  // Create test account using Ethereal for development
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'test@ethereal.email',
      pass: 'test',
    },
  });
  console.log('⚠️  SMTP credentials not configured. Using Ethereal test account. Configure SMTP_USER and SMTP_PASS in .env for real email delivery.');
} else {
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data?: { email: string; token: string; urlLink?: string },
) => {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compileTemplates = handlebars.compile(templateSource);
    
    // Default urlLink logic if not provided
    const urlLink = data?.urlLink || `${BASE_URL}/api/verify-email?token=${data?.token}`;
    
    const html = compileTemplates({ ...data, urlLink });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

