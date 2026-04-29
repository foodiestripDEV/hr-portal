export type Role = "master_admin" | "manager" | "employee";

export type RoleSlug = "admin" | "manager" | "employee";

export type LeaveKind = "holiday" | "sick" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type DocumentKind = "contract" | "invoice" | "official" | "private";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type InvoiceStatus = "paid" | "unpaid";

export type AuditAction =
  | "leave.requested"
  | "leave.approved"
  | "leave.rejected"
  | "document.download_requested"
  | "invoice.batch_generated"
  | "invoice.status_updated"
  | "invoice.download_requested"
  | "invoice.exported"
  | "employee.profile_updated"
  | "employee.role_updated"
  | "employee.password_reset_requested"
  | "slack.interaction_received";

export type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  location: string;
  managerId: string | null;
  startDate: string;
  profilePhotoUrl: string | null;
  holidayAllowance: number;
  holidayRemaining: number;
  sickDaysUsed: number;
  unpaidLeaveUsed: number;
  financialProfile: {
    currency: "EUR" | "USD" | "GBP";
    monthlyRate: number;
    invoiceCycle: "monthly";
    contractType: "employment" | "contractor";
  };
};

export type LeaveRequestRecord = {
  id: string;
  employeeId: string;
  kind: LeaveKind;
  status: LeaveStatus;
  from: string;
  to: string;
  days: number;
  requestedAt: string;
  reviewerId: string | null;
  decidedAt: string | null;
  slackThreadId: string | null;
};

export type DocumentRecord = {
  id: string;
  employeeId: string;
  kind: DocumentKind;
  status: DocumentStatus;
  title: string;
  period: string;
  amount: number | null;
  currency: "EUR" | "USD" | "GBP" | null;
  issuedAt: string;
  privateStorageKey: string;
};

export type InvoiceRecord = {
  id: string;
  employeeId: string;
  period: string;
  amount: number;
  currency: "EUR" | "USD" | "GBP";
  status: InvoiceStatus;
  generatedAt: string;
  pdfStorageKey: string;
};

export type AuditLogRecord = {
  id: string;
  actorId: string;
  action: AuditAction;
  targetType: "leave_request" | "document" | "invoice" | "invoice_batch" | "employee" | "slack";
  targetId: string;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type Viewer = Pick<
  EmployeeRecord,
  "id" | "name" | "email" | "role" | "title" | "department" | "profilePhotoUrl"
>;

export type SafeEmployeeDTO = {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  location: string;
  managerName: string | null;
  startDate: string;
  role: Role;
  profilePhotoUrl: string | null;
};

export type LeaveRequestDTO = {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  employeeTitle: string;
  employeeHolidayAllowance: number;
  employeeHolidayRemaining: number;
  kind: LeaveKind;
  status: LeaveStatus;
  from: string;
  to: string;
  days: number;
  requestedAt: string;
  reviewerName: string | null;
  canDecide: boolean;
};

export type DocumentDTO = {
  id: string;
  employeeName: string;
  employeeId: string;
  kind: DocumentKind;
  status: DocumentStatus;
  title: string;
  period: string;
  amountLabel: string | null;
  issuedAt: string;
};

export type DashboardViewModel = {
  activeRoleSlug: RoleSlug;
  viewer: Viewer;
  roleOptions: Array<{
    slug: RoleSlug;
    label: string;
  }>;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
    tone: "blue" | "emerald" | "amber" | "rose" | "zinc";
  }>;
  balances: {
    holidayRemaining: number;
    holidayAllowance: number;
    sickDaysUsed: number;
    unpaidLeaveUsed: number;
  };
  leaveRequests: LeaveRequestDTO[];
  documents: DocumentDTO[];
  directory: SafeEmployeeDTO[];
  teamCalendar: Array<{
    id: string;
    employeeName: string;
    kind: LeaveKind;
    status: LeaveStatus;
    from: string;
    to: string;
  }>;
  adminFinancials: Array<{
    employeeName: string;
    monthlyRateLabel: string;
    contractType: string;
    invoiceCycle: string;
  }>;
  auditEvents: Array<{
    id: string;
    action: AuditAction;
    actorName: string;
    targetType: string;
    createdAt: string;
  }>;
};

export type ActionResult = {
  ok: boolean;
  message: string;
};
