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
- All major product areas must be designed as modules. Modules must have a stable key, title, description, icon, permissions, seed data when needed, and a database-controlled enabled/disabled state.
- The portal must support a plugin/module-style operating model: modules can be logically installed, enabled, disabled, and hidden from navigation/admin surfaces without changing user-facing code paths manually.
- Runtime deletion of application code is not required or recommended. "Uninstall" should mean disabling the module, removing/hiding its navigation and actions, and optionally cleaning module-owned data through a controlled migration or admin action.
- When a module reaches an acceptable, stable, user-approved scope, stop expanding it in the current phase. Record additional ideas as future-phase improvements instead of continuously adding scope to the active module.

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
- Feature modules must be able to be disabled globally, for example disabling the Training/LMS module completely.

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
- When a feature page becomes crowded or has multiple workflows, split it into tabs, submenus, or child pages. Do not keep unrelated workflows such as create forms, lists, settings, users, reports, and history all visible on one screen.
- When any product area or feature phase is completed, update the Persian user/admin guide and the technical documentation for that area in the same change. Documentation must explain what changed, who can access it, important settings, and where screenshots should be added.
- Maintain project-wide technical documentation from this point onward. Each completed module or phase must include enough technical notes for future maintenance, deployment, permissions, and security review.

## Project UI Rules

AGTPS Portal should be built as a modern Next.js website with:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui style components.
- 21st.dev templates/components when useful.
- Motion for React for animations.

Design rules:

- First create a design system before coding major UI work.
- Use UI/UX Pro Max thinking:
  - Define layout pattern.
  - Define color palette.
  - Define typography.
  - Define spacing scale.
  - Define animation rules.
  - Define accessibility checklist.
- Use polished, production-ready UI.
- Do not create generic AI-looking purple gradient UI unless requested.
- Use responsive design for 375px, 768px, 1024px, and 1440px.
- Use visible focus states.
- Respect `prefers-reduced-motion`.
- Use SVG icons from `lucide-react`, not emojis.
- Use Motion only for meaningful animations:
  - Hero entrance.
  - Card hover.
  - Section reveal.
  - Page transitions.
  - Micro interactions.

Code rules:

- Components go in `/components`.
- Reusable UI goes in `/components/ui`.
- Pages go in `/app`.
- Keep components small and clean.
- Use TypeScript types.
- After changes, run lint/build.

Design guidance skill:

- Keep the UI/UX Pro Max skill repository beside the project at `.ai-skills/ui-ux-pro-max-skill`.
- When design guidance is needed, read `AGENTS.md` and `.ai-skills/ui-ux-pro-max-skill/README.md` before proposing or implementing UI structure.
- Use this skill as design guidance; it does not replace the existing project architecture rules.

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
