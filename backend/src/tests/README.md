# Backend unit tests

Run from `backend`:

```sh
npm install --ignore-scripts
npm test -- --runInBand --coverage --json --outputFile=coverage/test-results.json
```

The existing location is `src/tests`, retained rather than creating a competing root-level `tests` tree. Jest is the existing framework. `jest.config.js` enforces at least 75% independently for statements, branches, functions, and lines.

Coverage includes **all files** in `src/controllers`, `src/services`, `src/middleware`, `src/schedulers`, and `src/utils`, except the removed standalone `roles.controller.js` and `permissions.controller.js`. It excludes route declarations, static configuration, database connection startup, server startup, and migrations; the reported percentage is unit-source coverage, not every executable file in the repository. Existing authentication access checks and role resolution within user management remain covered.

## Isolation and architecture

- `setup.js` substitutes the database before any production module loads, mocks Nodemailer, and blocks unexpected HTTPS calls. No `.env` or production entry point is loaded.
- Controller tests call the actual controllers and actual query/response helpers with the shared database mock. These controllers have no repository/service layer to invent.
- Expiry/manual-alert controller tests mock the Telegram service. Telegram service tests use the real service with a mocked database and `https.request`, including response events, errors, and timeouts.
- Scheduler tests mock the Telegram service and use fake clocks/timers. Mailer tests use a mocked transport.
- `mocks/controller.js` provides request/response spies and ordered database replies. It reports unexpected extra database queries as errors.
- Existing Supertest assertions are retained using `mocks/app.js`, a minimal controller harness that never starts production migrations or the production listener. Categories are mounted directly to isolate controllers; production access-control middleware is tested separately. Corrected stale auth fixtures to use the actual `role` alias and Administrator role, and corrected middleware path casing.

## What the stock and expiry tests establish

Stock writes assert actual quantity parameters, audit before/after values, depletion, insufficient-stock rejection, edits, reversal, and failure propagation. A stateful mock separately demonstrates the lack of atomic rollback.

Current-stock aggregation, stock-history lookup, and expiry classification happen in MySQL SQL/views. Unit tests assert query predicates, search parameters, sort order, and response preservation. Expired is strictly before today; near expiry includes today through day 30; Telegram urgent expiry includes day 0 through day 7. These tests do **not** execute SQL or simulate a second implementation of those date predicates. MySQL integration tests against an isolated disposable database are needed to verify actual filtering for yesterday, today, day 7/8, day 30/31, null dates, inactive/empty batches, and multiple batches. No production database should be used for those tests.

See `BUGS_FOUND.md` for separately reported application defects. Passing characterization tests preserve known current behavior; coverage is not a claim that the backend is bug-free.

## Reports

Jest writes `coverage/index.html`, `coverage/coverage-summary.json`, `coverage/coverage-final.json`, and `coverage/test-results.json`. The checked-in `UNIT_TEST_REPORT.md` records the final run and module breakdown. Generated coverage is ignored by Git.
