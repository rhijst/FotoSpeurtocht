const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

async function sendMail(to, subject, text) {
  await transporter.sendMail({
    from: '"PhotoPrestiges" <noreply@photoprestiges.com>',
    to,
    subject,
    text,
  });

  console.log(`📧 Mail sent to ${to}`);
}

module.exports = { sendMail };