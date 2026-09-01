# AGENT.md

## Project

Medicine Inventory System for a small pharmacy in Cambodia.

The system includes:
- Dashboard
- Products
- Categories
- Units
- Suppliers
- Stock In
- Stock Out
- Current Stock
- Stock History
- Expiry Management
- Users
- Roles & Permissions
- Reports
- Settings

---

## General Rules

- Follow the existing project structure and coding style.
- Inspect existing code before creating new patterns.
- Reuse existing controllers, services, middleware, utilities, and response formats.
- Keep implementation simple and maintainable.
- Do not introduce unnecessary dependencies.
- Do not rename existing APIs, tables, fields, or folders unless required.
- Do not break existing functionality.
- Do not modify unrelated code.

---

## Backend Architecture

Keep responsibilities separated:

- `controllers/` → HTTP request/response handling only
- `services/` → business logic
- `routes/` → route definitions
- `Middleware/` → authentication, authorization, validation
- `config/` → configuration
- `utils/` → reusable helpers
- `schedulers/` → scheduled/background jobs
- `tests/` → automated tests
- `migrations/` → database schema/data changes
- `scripts/` → maintenance or seed scripts

Do not place complex business logic directly inside routes or controllers.

---

## Database Rules

- Always create a migration for database schema changes.
- Never manually modify production database structure.
- Use foreign keys where relationships exist.
- Use timestamps where consistent with existing tables.
- Preserve existing data when changing schemas.
- Avoid destructive migrations unless explicitly required.
- Add indexes for frequently searched or referenced fields where appropriate.

---

## Role & Permission Rules

Roles must be dynamic and stored in the database.

Default roles:

1. Administrator / Owner
2. Pharmacist
3. Stock Staff

Never hardcode role IDs in frontend or backend authorization logic.

Use permissions instead of role-name checks whenever possible.

Example:

GOOD:
`hasPermission("PRODUCT_CREATE")`

BAD:
`if (user.role === "Pharmacist")`

Users should reference a `roleId`.

Roles should have many permissions.

---

## Default Permissions

### Administrator / Owner

Full system access.

### Pharmacist

- Dashboard: View
- Products: View, Create, Update
- Categories: View
- Units: View
- Suppliers: View
- Stock In: View
- Stock Out: View, Create
- Current Stock: View, Export, Print
- Stock History: View
- Expiry Management: View, Export, Print
- Reports: View
- No Users access
- No Role Management access
- No Settings access

### Stock Staff

- Dashboard: View
- Products: View
- Categories: View
- Units: View
- Suppliers: View, Create, Update
- Stock In: View, Create, Update
- Stock Out: View, Create
- Current Stock: View, Export, Print
- Stock History: View, Export, Print
- Expiry Management: View, Import, Export, Print
- Reports: View
- No Users access
- No Role Management access
- No Settings access

---

## Permission Naming

Prefer consistent permission codes:

- `DASHBOARD_VIEW`

- `PRODUCT_VIEW`
- `PRODUCT_CREATE`
- `PRODUCT_UPDATE`
- `PRODUCT_DELETE`

- `CATEGORY_VIEW`
- `CATEGORY_CREATE`
- `CATEGORY_UPDATE`
- `CATEGORY_DELETE`

- `UNIT_VIEW`
- `UNIT_CREATE`
- `UNIT_UPDATE`
- `UNIT_DELETE`

- `SUPPLIER_VIEW`
- `SUPPLIER_CREATE`
- `SUPPLIER_UPDATE`
- `SUPPLIER_DELETE`

- `STOCK_IN_VIEW`
- `STOCK_IN_CREATE`
- `STOCK_IN_UPDATE`

- `STOCK_OUT_VIEW`
- `STOCK_OUT_CREATE`

- `CURRENT_STOCK_VIEW`
- `CURRENT_STOCK_EXPORT`
- `CURRENT_STOCK_PRINT`

- `STOCK_HISTORY_VIEW`
- `STOCK_HISTORY_EXPORT`
- `STOCK_HISTORY_PRINT`

- `EXPIRY_VIEW`
- `EXPIRY_IMPORT`
- `EXPIRY_EXPORT`
- `EXPIRY_PRINT`

- `USER_VIEW`
- `USER_CREATE`
- `USER_UPDATE`
- `USER_DELETE`

- `ROLE_VIEW`
- `ROLE_CREATE`
- `ROLE_UPDATE`
- `ROLE_DELETE`

- `REPORT_VIEW`

- `SETTING_VIEW`
- `SETTING_UPDATE`

---

## Authorization

Authorization must be enforced in the backend.

Do not depend only on hiding frontend buttons.

For protected endpoints:

1. Authenticate user.
2. Load user role/permissions.
3. Verify required permission.
4. Return `403 Forbidden` when permission is missing.

Frontend permission checks are for UX only.

---

## API Rules

Use consistent REST APIs.

Examples:

- `GET /api/roles`
- `POST /api/roles`
- `GET /api/roles/:id`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`

Use appropriate status codes:

- `200` success
- `201` created
- `400` invalid request
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `409` duplicate/conflict
- `500` unexpected server error

Return errors using the project's existing response format.

---

## Validation

Validate all incoming data.

Examples:

- Required fields must not be empty.
- Email must have a valid format.
- Role name must be unique.
- User must reference an existing active role.
- Quantities must not be negative.
- Stock Out must not exceed available stock.
- Duplicate product codes should not be allowed where applicable.

Never trust frontend validation alone.

---

## Inventory Rules

Stock changes must preserve inventory integrity.

- Stock In increases available quantity.
- Stock Out decreases available quantity.
- Prevent negative stock.
- Keep stock transaction/history records.
- Do not directly overwrite stock without a traceable transaction unless existing architecture explicitly supports it.
- Expiry-related data must remain linked to the correct product/batch where applicable.

---

## Security

- Never expose passwords.
- Hash passwords using the existing secure hashing mechanism.
- Never log passwords, tokens, or sensitive credentials.
- Keep secrets in `.env`.
- Never commit `.env`.
- Validate authorization on every protected API.
- Use parameterized queries / ORM-safe operations.
- Avoid exposing internal stack traces to users.

---

## Code Quality

- Prefer descriptive function and variable names.
- Keep functions small and focused.
- Avoid duplicated logic.
- Extract shared logic into services or utilities.
- Remove unused imports and dead code.
- Handle async errors correctly.
- Do not silently ignore exceptions.
- Follow existing lint/formatting conventions.

---

## Testing

When changing business logic:

- Add or update tests.
- Test successful cases.
- Test validation errors.
- Test permission denied cases.
- Test unauthorized requests.
- Test important inventory edge cases.
- Do not remove existing tests just to make the test suite pass.

---

## Before Making Changes

Before implementing a feature:

1. Inspect relevant routes.
2. Inspect controller.
3. Inspect service.
4. Inspect database schema/migrations.
5. Inspect authentication/authorization middleware.
6. Inspect existing API response style.
7. Reuse existing implementation patterns.

Do not create a second architecture when an existing pattern already exists.

---

## Final Verification

Before finishing:

- Check the application builds/runs.
- Check migrations.
- Check affected APIs.
- Check permission behavior
- Check for breaking changes.
- Check tests.
- Summarize files changed and important implementation decisions.