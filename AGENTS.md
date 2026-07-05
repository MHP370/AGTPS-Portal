# AGTPS Portal - Project Instructions for Codex

## Collaboration Rules

- The user will first explain the desired work; do not start implementation until the user says to start.
- The user is not expected to know programming details. Codex should handle technical implementation and explain actions in simple language.
- Before making changes, explain briefly what will be changed and why.
- Think carefully before every answer and every change.
- Ask the user questions whenever requirements are unclear or a decision affects the product.
- When the user suggests an idea or feature, evaluate whether it conflicts with standards, security, maintainability, or product quality. If it has drawbacks or should not be done, explain the reason clearly before implementing.
- After each meaningful change, ask the user to test the project and report the result.
- Only update GitHub after the user confirms the tested change is working.
- After the user confirms a change is OK, commit the approved change locally, then provide the exact push commands for the user to run manually. Do not push to GitHub directly.
- If project instructions need to change, only update them when the user asks.

## Product Goal

AGTPS Portal should become a polished enterprise internal portal and admin system inspired by the provided visual reference:

- Dark, modern, RTL Persian enterprise dashboard.
- Central portal/home experience with organization systems, status, announcements, calendar, downloads, and quick access.
- Admin panel for managing applications, categories, users, roles, permissions, and future modules.

## Current Project Context

AGTPS Portal is a full-stack enterprise internal admin system.

It is used to manage:

- Applications/internal systems.
- Categories.
- Users.
- Roles and permissions.
- Future modules: sites, dashboard, logs, announcements, downloads, calendar, and portal widgets.

## Tech Stack

Frontend:

- Next.js App Router.
- React Server and Client Components.
- TypeScript.
- TailwindCSS.
- TanStack React Query.
- Custom UI components.

Backend:

- NestJS.
- REST API.
- JWT authentication.
- Prisma ORM.

Important local API base URL:

- `http://localhost:3002/api`

## Architecture Rules

- Frontend app lives in `apps/web`.
- Backend API lives in `apps/api`.
- All frontend API calls must go through `apps/web/lib/api.ts`.
- Data fetching must use React Query hooks in `apps/web/hooks`.
- Shared UI components live in `apps/web/components/ui`.
- Feature components live in `apps/web/components/features`.
- Keep React Query as the main data layer.
- Do not introduce new state management libraries unless the user explicitly approves.
- Keep the existing UI structure where possible.
- Do not refactor the whole architecture unless the user explicitly asks.
- Fix broken data flows with focused, minimal changes.
- All new and existing UI work must be responsive across desktop, tablet, and mobile. Before considering a UI change complete, verify that layouts, dialogs, tables, forms, maps, widgets, and text do not overflow or overlap on small screens.
- When a feature is finalized, update or add database seed data if the feature needs default records, demo data, permissions, roles, settings, or lookup values to work well after a fresh setup.

## Implemented Modules

Authentication:

- JWT login.
- Token stored in `localStorage`.
- Login endpoint: `POST /auth/login`.

Applications:

- Create application.
- Edit application.
- Delete application.
- Assign category.
- Important fields: `title`, `key`, `slug`, `categoryId`, `status`, `networkType`.

Categories:

- Create category.
- Edit category.
- Delete category.
- Important fields: `name`, `slug`, `icon`, `color`, `isActive`.
- Used by the Applications category dropdown.

Roles and permissions:

- Role management.
- Permission assignment.
- Role-permission mapping.
- Partially implemented.

## Known Issues

- Categories dropdown sometimes does not render correctly.
- Categories must always be passed to application create/edit forms before render.
- React Query and API response handling need to be stable.
- Application form state synchronization needs improvement.
- CRUD flows must avoid undefined state bugs, empty dropdowns, and UI freezing.

## Desired Code Organization

- Page: state controller and data orchestration.
- Table: display/UI only.
- Dialog: controlled component.
- Form: pure input layer.

## Next Work Items

1. Fix Categories dropdown rendering stability.
2. Stabilize ApplicationForm state handling.
3. Ensure Create/Edit Application works end to end.
4. Remove race conditions in React Query usage.
5. Improve loading and error states consistency.
6. After user testing confirms success, update GitHub.

## Expected Stable State

- Applications CRUD fully working.
- Categories CRUD fully working.
- No empty dropdowns.
- No undefined state bugs.
- Clean React Query data flow.
- Stable, polished admin panel.
- Ready for production internal use.
