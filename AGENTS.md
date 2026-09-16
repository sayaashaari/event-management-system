# AGENTS.md

## Project

Event Management System

This project is an intermediate-level frontend prototype for a Vibe Coding workshop.

## Objective

Build and maintain a simple Event Management System for managing:

- Events
- Participants
- Registrations
- Attendance
- Dashboard statistics

## Core Rules

1. Inspect the existing project before making changes.
2. Preserve working functionality unless it conflicts with the PRD.
3. Follow `PRD.md` for product requirements.
4. Follow `DESIGN.md` for visual and UX rules.
5. Prefer small, incremental changes.
6. Do not rebuild the application unnecessarily.
7. Do not introduce unnecessary dependencies.
8. Keep the code understandable for intermediate learners.
9. Verify the actual application after making changes.
10. Fix errors before considering a task complete.

## Technical Constraints

Use frontend-only architecture.

Required:

- Existing project stack where practical
- Browser `localStorage`
- Responsive UI
- Client-side validation

Do NOT introduce:

- Supabase
- Firebase
- Backend services
- External databases
- External APIs
- OAuth
- Payment gateways
- Email services

## Data Storage

Use localStorage for:

- users
- events
- participants
- registrations
- attendance
- authentication state

Use clear, consistent storage keys.

## Authentication

Demo credentials:

- Username: `admin`
- Password: `admin123`

This is demo authentication only.

Do not present it as production-grade security.

## Development Workflow

Before coding:

1. Read `PRD.md`.
2. Read `DESIGN.md`.
3. Inspect the existing architecture.
4. Identify reusable components.
5. Identify existing routes and state management.
6. Plan the smallest change that satisfies the requirement.

After coding:

1. Run the application.
2. Check for errors.
3. Test the changed functionality.
4. Check related functionality for regressions.
5. Fix problems.
6. Verify again.

## Change Discipline

Prefer:

- Small changes
- Reusable components
- Simple state management
- Clear function names
- Consistent data structures
- Minimal dependencies

Avoid:

- Large unnecessary refactors
- Rewriting working components
- Overengineering
- Complex abstractions without a clear benefit
- Adding backend infrastructure

## CRUD Rules

All CRUD operations must update the UI and localStorage consistently.

When deleting records, consider related data.

Examples:

- Deleting an event should not leave broken registrations or attendance records.
- Deleting a participant should not leave broken registrations or attendance records.

Use confirmation before destructive actions.

## Business Rules

Registration:

- Event must exist.
- Participant must exist.
- Duplicate registration is not allowed.
- Registration cannot exceed event capacity.

Participant:

- Email is required.
- Duplicate participant email is not allowed.

Event:

- Event name is required.
- Date is required.
- Time is required.
- Location is required.
- Capacity must be greater than zero.

## Verification

Always verify:

- Login
- Logout
- Dashboard statistics
- Event CRUD
- Participant CRUD
- Registration
- Capacity validation
- Duplicate registration prevention
- Attendance
- Attendance calculation
- localStorage persistence
- Search and filtering
- Responsive layout


## Local Preview

Before deployment, run and preview the application locally.

Workflow:

```text
BUILD → RUN LOCALLY → PREVIEW → TEST → FIX → VERIFY
```

Rules:

1. Inspect `package.json` first and identify the framework and correct start command.
2. Install dependencies only if required.
3. Start the development server using the existing project setup.
4. Keep the server running while previewing and testing.
5. Report the exact localhost URL.
6. If Codex provides a **Preview** option, use it first. If Preview is unavailable, open the reported localhost URL manually.
7. Do not modify application code merely to create a preview.
8. Use the local preview to test the main flows before deployment.

## GitHub Repository & Deployment Workflow

When deployment is requested, follow this sequence:

```text
INSPECT → FIX → VERIFY → BUILD → COMMIT → PUSH → GITHUB ACTIONS → GITHUB PAGES → VERIFY LIVE SITE
```

Before changing deployment configuration:

1. Verify the actual GitHub remote URL.
2. Identify the actual repository owner and repository name.
3. Check the current branch.
4. Do not assume the repository name from an old configuration or local folder name.
5. Inspect the existing GitHub Actions workflow.

For GitHub Pages:

- Configure Vite `base` using the actual repository name when deploying as a project site.
- Prefer GitHub Actions as the Pages deployment source.
- Build the production bundle before pushing deployment changes.
- Verify `dist` output and asset paths.
- Verify GitHub Pages is enabled and configured to deploy from GitHub Actions.
- Push only the required changes.
- Verify the Actions deployment job.
- Open and verify the final GitHub Pages URL.

Do not stop after creating the workflow. Deployment is complete only after the live site is verified.

## Deployment Verification Checklist

Verify:

- Repository remote
- Branch
- Vite base path
- GitHub Actions workflow
- Production build
- `dist` output
- Asset paths
- GitHub Pages configuration
- Live URL
- Login
- Events CRUD
- Participants CRUD
- Registration
- Attendance
- localStorage persistence
- Responsive layout

If GitHub Pages is blocked by repository settings or authentication, report the exact blocker and the required user action instead of claiming deployment succeeded.

## Communication

When explaining changes:

- Be concise.
- State what changed.
- Mention important decisions.
- Mention any limitation or unresolved issue.
- Do not claim something works unless it has been verified.

## Deployment

Preferred deployment target: GitHub Pages.

Deployment rules:

- Keep the application as a static frontend.
- Keep `localStorage` as the data storage mechanism.
- Do not add a backend just to support deployment.
- Use the existing Vite setup where applicable.
- Configure the Vite `base` path correctly for a GitHub Pages project site.
- Prefer GitHub Actions for repeatable production deployment.
- Build the production version before deployment.
- Fix build errors before deployment.
- Verify asset paths after deployment.
- Verify application routes after deployment.
- Verify login, CRUD, registration, attendance and localStorage persistence on the deployed site.
- Do not introduce unnecessary deployment dependencies.

Deployment limitations:

- Data stored in localStorage is browser-specific.
- Data is not shared between different users or devices.
- Demo authentication is not suitable for production security.
- GitHub Pages does not provide a backend database for this prototype.
