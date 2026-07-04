import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  let transporter;

  const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    // Real SMTP configuration (e.g. Gmail, SendGrid, Brevo)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Generate a one-time test Ethereal SMTP account
    console.log('[MAILER] No SMTP configuration found in .env. Generating mock Ethereal SMTP test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: hasSmtpConfig 
      ? `"NovaTask" <${process.env.SMTP_USER}>`
      : '"NovaTask Assistant" <no-reply@novatask.ai>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!hasSmtpConfig) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n=============================================================`);
    console.log(`[ETHEREAL EMAIL SENT] Mail sent to: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Click link to view test email: ${previewUrl}`);
    console.log(`=============================================================\n`);
    return { previewUrl };
  }

  console.log(`[EMAIL SENT] Successfully sent real email to ${options.email}`);
  return { success: true };
};
