// mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ALERT_EMAIL_USER,   // e.g. your-app@gmail.com
    pass: process.env.ALERT_EMAIL_APP_PASSWORD, // 16-char App Password, not your real password
  },
});

async function sendSecurityAlert({ to, subject, message }) {
  await transporter.sendMail({
    from: `"Account Security" <${process.env.ALERT_EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h2>${subject}</h2>
        <p>${message}</p>
        <p style="color:#888;font-size:12px;">If this wasn't you, please reset your password immediately.</p>
      </div>
    `,
  });
}

module.exports = { sendSecurityAlert };