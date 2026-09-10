const nodemailer = require('nodemailer');
const { sendSecurityAlert } = require('../../../utils/mailer');
const transporter = nodemailer.createTransport.mock.results[0].value;
test('shouldSendSecurityAlertThroughMockTransport', async () => {
  await sendSecurityAlert({ to: 'test@example.com', subject: 'Password changed', message: 'Your password was changed.' });
  expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com', subject: 'Password changed', html: expect.stringContaining('Your password was changed.') }));
});
test('shouldPropagateMailTransportError', async () => {
  const error = new Error('SMTP failed'); transporter.sendMail.mockRejectedValueOnce(error);
  await expect(sendSecurityAlert({ to: 'test@example.com', subject: 'Alert', message: 'Test' })).rejects.toBe(error);
});
