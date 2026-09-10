// Never load the production database, SMTP transport, or Telegram API in unit tests.
jest.mock('../config/db', () => require('./mocks/db.mock'));
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })) }));
jest.mock('https', () => ({ request: jest.fn(() => { throw new Error('Unexpected external HTTPS request in unit test'); }) }));

beforeEach(() => {
  require('./mocks/db.mock').__setQueryResult([]);
});
