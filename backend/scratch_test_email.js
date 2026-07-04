import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const configs = [
    {
      name: 'Default 587 / secure false',
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    },
    {
      name: 'Port 465 / secure true',
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    },
    {
      name: 'Port 587 / with TLS option',
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  ];

  for (const config of configs) {
    console.log(`\n--- Testing config: ${config.name} ---`);
    const transporter = nodemailer.createTransport(config);
    try {
      await transporter.verify();
      console.log(`Success with: ${config.name}!`);
      return;
    } catch (error) {
      console.log(`Failed with: ${config.name}`);
      console.log(error.message);
    }
  }
};

run();
