# HR Portal Architecture

## Product Direction

Build this as a private web application, not a desktop application. The product needs multi-user access, Slack approvals, monthly invoice generation, document downloads, audit logs, and centralized access control. A private web app gives stronger operational control than a desktop app for this workflow because deployments, backups, permissions, and integrations can be managed in one place.

## Recommended Stack

- App: Next.js App Router with TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL
- ORM: Prisma or Drizzle
- Auth: SSO through Google Workspace or Microsoft Entra when available
- Storage: private object storage such as S3 or Cloudflare R2
- PDFs: server-side invoice templates rendered to PDF
- Slack: Slack App with signed request verification and interactive approvals
- Hosting: private cloud, self-hosted VPS, or locked-down managed hosting with strong environment separation

## Access Model

- Master Admin: HR and CEO, full access to employee records, documents, invoices, balances, and request decisions.
- Manager: can review and decide leave requests for direct reports; can view team leave calendar; cannot view payroll, invoices, contracts, or financial profile fields for team members.
- Employee: can view only their own dashboard, balances, requests, invoices, and contracts.

All access checks should be resource-level checks, not only route-level role checks. A manager role is not enough to read data; the target employee must be a direct report.

## Security Baseline

- Keep employee documents out of `public/`.
- Generate short-lived signed download URLs only after server-side authorization.
- Put all database access behind a server-only data access layer.
- Return DTOs that contain only fields the screen needs.
- Re-check auth and authorization inside every Server Action and Route Handler.
- Verify Slack request signatures and map Slack users to internal users before approving or rejecting requests.
- Use fake or anonymized seed data in development.
- Encrypt sensitive fields and rely on database/storage encryption at rest.
- Add audit logs for document access, balance changes, invoice generation, and approval decisions.

## Initial Data Model

- User / Employee
- Role / Permission
- Manager relationship
- Leave balance
- Leave request
- Leave decision
- Document with type and status
- Invoice
- Invoice line item
- Slack approval event
- Audit log

## Admin Workspace Scope

Admin functionality should be split into focused pages instead of relying only on the main dashboard:

- `/admin`: employee access, email visibility, password reset action, future profile photo support, and role assignment.
- `/admin/requests`: leave and request queue with status, employee, approver, and date range filters.
- `/admin/calendar`: month calendar view showing who is off on which day, with approved and pending requests styled differently.
- `/admin/documents`: private document register with status, employee, date range, and document type filters.
- `/admin/invoices`: invoice register with employee, date range, paid/unpaid status filters, period generation, edit, download, multi-select, and CSV export.

Admin filters required across the main operational pages:

- Status filter: pending, approved, rejected for requests/documents; paid/unpaid for invoices.
- Person filter: search by employee name or email.
- Date filter: request leave dates, document issued date, or invoice generated date.

Request rows must clearly show who requested the leave, who is responsible for approval or who approved it, the requested leave dates, and the employee's remaining leave balance.

Document types should include:

- Invoice
- Official document
- Private document
- Contract

Calendar requirements:

- Month-grid calendar view.
- Approved and pending leave requests shown with different colors.
- Turkey and Italy public holidays seeded for the visible year, with a production path to move holidays into a policy/configuration table.

Admin user management requirements:

- Show employee email.
- Allow password reset request recording.
- Reserve a field for future profile photos.
- Allow Admin to assign Employee, Manager, or Admin roles.

Invoice requirements:

- Filter by person, generated date range, and paid/unpaid status.
- Generate invoices for a selected period.
- Edit invoice status.
- Download invoice files.
- Select multiple invoices and export CSV.

## MVP Order

1. Auth and role-aware route protection
2. PostgreSQL schema and migrations
3. Employee dashboard with leave balances and document list
4. Leave request submission and admin/manager approval queue
5. Slack notification and interactive approval callback
6. Private document upload/download flow
7. Admin employee management
8. Monthly invoice generation and PDF export
9. Audit logging, tests, backups, and deployment hardening

## Current Backend Scaffold

- `lib/hr/repository.ts`: in-memory repository used by the demo until PostgreSQL is connected.
- `lib/hr/session.ts`: signed HTTP-only cookie session auth with production secret enforcement.
- `app/login/page.tsx`: credential login page.
- `app/actions/auth.ts`: login/logout Server Actions.
- `lib/hr/commands.ts`: mutation layer with validation, authorization, and audit logging.
- `app/actions/hr.ts`: Server Actions for UI forms.
- `app/api/dashboard/route.ts`: dashboard DTO endpoint.
- `app/api/leave-requests/route.ts`: leave list and create endpoint.
- `app/api/leave-requests/[id]/decision/route.ts`: manager/admin decision endpoint.
- `app/api/documents/[id]/download/route.ts`: authorized private download URL endpoint.
- `app/api/invoices/generate/route.ts`: admin-only unpaid invoice generation endpoint.
- `app/api/invoices/[id]/download/route.ts`: authorized invoice download endpoint.
- `app/api/invoices/export/route.ts`: admin-only filtered or selected invoice CSV export endpoint.
- `app/api/slack/interactions/route.ts`: Slack interaction callback with request signature verification.
- `prisma/schema.prisma`: target PostgreSQL schema.

## Authentication State

The UI no longer uses a role switch query parameter. Users must sign in, the dashboard reads the viewer from the session cookie, and every Server Action or API route re-checks authorization from the authenticated viewer.

Development accounts use mock employee emails and `HR_DEMO_PASSWORD`. Production must set:

- `SESSION_SECRET`
- `HR_PASSWORD_HASHES`
- `SLACK_SIGNING_SECRET`
- `SLACK_USER_MAP`
- `DATABASE_URL`

## Open Decisions

- Identity provider: Google Workspace, Microsoft Entra, or email/password.
- Hosting target and whether access must sit behind VPN or IP allowlist.
- Leave policy: annual allowance, carry-over, half-days, sick-day policy, unpaid leave rules.
- Approval policy: manager only, manager plus HR, or HR/CEO for special cases.
- Invoice format and numbering rules.
- Slack routing: HR channel, direct messages, or both.
