# Final backend unit-test report

Run date: 2026-09-10. Command, from `backend`:

```sh
npm test -- --runInBand --coverage --json --outputFile=coverage/test-results.json
```

| Metric | Result |
| --- | ---: |
| Total Test Suites | 19 |
| Total Tests | 411 |
| Passed | 411 |
| Failed | 0 |
| Statements | 100% (806/806) |
| Branches | 99.50% (597/600) |
| Functions | 100% (109/109) |
| Lines | 100% (703/703) |
| Overall Coverage | 100% statements; all four metrics exceed 75% |

## Module summary

Coverage in this table means statement coverage. Each test is counted once. Shared catalog tests are assigned by their describe group; manual Telegram controller tests are assigned to their owning controller. Stock In, Stock Out, Current Stock, and Stock History share a single source controller and are grouped accordingly.

| Module | Tests | Passed | Failed | Coverage |
| ------ | ----: | -----: | -----: | -------: |
| Products / Medicines | 24 | 24 | 0 | 100% |
| Categories | 23 | 23 | 0 | 100% |
| Units | 19 | 19 | 0 | 100% |
| Suppliers | 20 | 20 | 0 | 100% |
| Stock In / Out / Current / History | 79 | 79 | 0 | 100% |
| Expiry Management | 10 | 10 | 0 | 100% |
| User Management | 31 | 31 | 0 | 100% |
| Authentication controllers | 33 | 33 | 0 | 100% |
| Dashboard | 7 | 7 | 0 | 100% |
| Reports | 57 | 57 | 0 | 100% |
| Settings | 24 | 24 | 0 | 100% |
| Telegram expiry / stock flags | 12 | 12 | 0 | 100% |
| Schedulers | 9 | 9 | 0 | 100% |
| Middleware | 32 | 32 | 0 | 100% |
| Utilities / JWT / Mail | 31 | 31 | 0 | 100% |
| **Total** | **411** | **411** | **0** | **100%** |

## Coverage scope and limitations

All source files in controllers, services, middleware, schedulers, and utilities are included, even if not imported by a test. The explicitly removed standalone Roles & Permissions controllers are excluded. Routes, static configuration, database initialization, server startup, and migration scripts are outside the unit-source denominator. No production business logic was modified.

No included source file is below 75% on any metric. Remaining uncovered branches are in `auth.controller.js` (97.43% branches) and `stock.controller.js` (98.85% branches): login with neither email nor username, unresolved supplier lookup by name, and a nonempty Current Stock search. Additional tests for those branches are optional; all coverage thresholds pass.

SQL boundary predicates are asserted rather than executed. Separate disposable-database integration tests are still needed for actual current-stock aggregation, the stock-history view, and expiry filtering across yesterday/today/day 7/day 8/day 30/day 31, null expiry, empty/inactive batches, and multiple batches. Concurrent stock operations also require integration tests after atomicity is fixed.

The suite uses mocked database calls, HTTPS, SMTP, service dependencies, and fake time where needed. The existing Supertest tests use a test-only app and never import production startup. Test fixtures were corrected to the current `role` alias and Administrator naming.

Known defects and their current/expected behavior are documented separately in [BUGS_FOUND.md](BUGS_FOUND.md). Characterization tests demonstrate current failures of application invariants while keeping the suite passing; they should change alongside future production fixes.
