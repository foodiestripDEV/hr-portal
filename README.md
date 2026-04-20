# Private HR Portal

Internal HR web application for employee self-service, leave approvals, private documents, and invoice operations.

## Current State

This repository contains the first Next.js UI and domain scaffold:

- Role-aware dashboard for Master Admin, Manager, and Employee views
- Real login/logout flow with signed HTTP-only session cookies
- Mock employee, leave, document, and financial records
- Centralized access-control helpers
- Backend route handlers for dashboard, leave requests, document download, invoices, and Slack interactions
- Server Actions for leave creation, leave decisions, and invoice generation
- Prisma schema for the PostgreSQL production model
- DTO-based dashboard model that keeps sensitive storage keys out of the UI
- Architecture notes in `docs/hr-portal-architecture.md`

The current data is fake prototype data held in memory for demo flow. Database persistence, encrypted object storage, and PDF generation are the next implementation steps.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

In development, use one of these emails:

- `maya.demir@example.com` for Master Admin
- `alessandro.rossi@example.com` for Manager
- `sofia.marino@example.com` for Employee

Default development password:

```text
HrPortal2026!
```

Set `SESSION_SECRET`, `HR_PASSWORD_HASHES`, and `HR_DEMO_PASSWORD` in `.env.local` before using this beyond local development.

## Verification

```bash
npm run lint
npm run build
```
