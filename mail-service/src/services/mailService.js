const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, text) {
  await resend.emails.send({
    from: 'FotoSpeurtocht <onboarding@resend.dev>',
    to: [to],
    subject,
    text,
  });

  console.log(`📧 Mail sent to ${to}`);
}

module.exports = { sendMail };
