# Bugs found during unit-test review

Production code was not changed. Tests labelled as documented defects characterize the current behavior; they are not endorsements of it and should be updated when the bugs are fixed.

## Bug Found: Stock operations are not atomic
File: `backend/src/controllers/stock.controller.js`

Function: `createStockIn`, `createStockOut`, `updateStockIn`, `updateStockOut`, `removeStockIn`, `removeStockOut`

Current Behavior: These functions execute independent writes without a database transaction. For example, `createStockOut` updates available quantity before inserting the transaction header, items, and movement. A failed header insert leaves the batch reduced despite a failed request. A stateful database mock reproduces a decrease from 10 to 5 after such an error. Concurrent read/modify/write requests also have no row locking.

Expected Behavior: All quantity, transaction, item, and audit changes should commit together or roll back together. Concurrent stock allocation should use appropriate locking or an atomic conditional update. With the production connection pool, a transaction must use one acquired connection throughout.

## Bug Found: Login JWT loses the forced-password-change flag
File: `backend/src/controllers/auth.controller.js`; `backend/src/utils/generateToken.js`

Function: `publicUser`, `login`, `generateToken`

Current Behavior: `publicUser` returns `mustChangePassword`, and login passes that object to `generateToken`. The token generator reads `must_change_password` instead, encoding false even when the user response says true. A test verifies the real signed JWT. `requirePasswordChanged` relies on the JWT flag.

Expected Behavior: The token and public user should both preserve the true flag so protected resources enforce the required password change.

## Bug Found: Non-finite stock quantities pass validation
File: `backend/src/controllers/stock.controller.js`

Function: `createStockIn`, `updateStockIn` (shared quantity validation also accepts fractions in Stock Out)

Current Behavior: `Number('Infinity')` passes `!qty || qty <= 0`, and Stock In passes Infinity to database writes. A test reproduces this with the database mocked. Fractional positive values also pass although batch quantity columns are `INT UNSIGNED` in `backend/migrations/20260801_default_init_schema.sql`.

Expected Behavior: Reject non-finite quantities and validate integer quantities consistent with the schema before making writes.

## Bug Found: Missing user crashes settings password update
File: `backend/src/controllers/settings.controller.js`

Function: `updatePassword`

Current Behavior: The function accesses `rows[0].password` without checking that a user exists. A valid token for a deleted user produces a TypeError forwarded to error handling.

Expected Behavior: Return a controlled user-not-found response without comparing or hashing passwords.

## Behavior requiring a product decision: empty Telegram summaries
File: `backend/src/services/telegramExpiryAlert.service.js`

Function: `sendDailyExpirySummary`

Current Behavior: Always sends one daily summary, including when no urgent batches exist. Per-batch messages are absent for an empty result. The service alerts only on batches expiring today through day 7; critical stock is a flag on those batches, not a separate alert for every low-stock product.

Expected Behavior: Keep the daily heartbeat if intentional. If the requested no-items/no-message behavior is a requirement, add an explicit empty-result guard. This is a requirements difference, not treated as an established application defect.
