import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { SMTP_USER, SMTP_PASS, BASE_URL } from '@/config';

const FROM_ADDRESS = `"Chill Movie" <${SMTP_USER}>`;

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendEmail = async (
  emailTo: string,
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
    
    const generateTemplate = compileTemplates({ ...data, urlLink });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: emailTo,
      subject: subject,
      html: generateTemplate,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

