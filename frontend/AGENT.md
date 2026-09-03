# AGENT.md

## Project

Medicine Inventory System for a small pharmacy in Cambodia.

Frontend stack:
- React
- Vite
- JavaScript
- REST API
- Existing custom UI components and styles

---

## General Rules

- Follow the existing project structure and coding style.
- Reuse existing components before creating new ones.
- Do not redesign unrelated pages.
- Do not break existing functionality.
- Keep UI simple, clean, and consistent.
- Do not hardcode backend data if an API already exists.
- Keep business logic out of UI components when possible.

---

## Project Structure

Use existing folders:

- `api/` → API configuration/request helpers
- `Authentication/` → login/authentication features
- `components/` → reusable components
- `context/` → global React context/state
- `page/` or `pages/` → page components
- `services/` → API/business service functions
- `utils/` → shared helpers
- `assets/` → frontend assets

Do not create duplicate folder structures.

---

## UI Style

Follow the existing Medicine Inventory design.

Use:
- Primary color: Teal
- Light backgrounds
- Dark navy text
- Soft gray borders
- Rounded cards and inputs
- Minimal shadows

Keep spacing, button sizes, table styles, and form layouts consistent with existing pages.

---

## User Roles

Roles must be loaded dynamically from backend.

Default roles:

1. Administrator / Owner
2. Pharmacist
3. Stock Staff

Never hardcode role IDs.

Use:

```js
user.roleId