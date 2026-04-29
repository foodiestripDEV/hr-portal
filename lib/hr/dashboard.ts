import {
  canDecideLeaveRequest,
  canViewDocument,
  canViewEmployeeProfile,
  canViewFinancialProfile,
  canViewLeaveRequest,
  roleOptions,
} from "./access-control";
import {
  listAuditLogs,
  listDocuments,
  listEmployees,
  listLeaveRequests,
} from "./repository";
import { getRoleSlugFromViewer } from "./session";
import type {
  AuditLogRecord,
  DashboardViewModel,
  DocumentDTO,
  DocumentRecord,
  EmployeeRecord,
  LeaveRequestDTO,
  LeaveRequestRecord,
  SafeEmployeeDTO,
  Viewer,
} from "./types";

export async function getDashboardViewModel(viewer: Viewer): Promise<DashboardViewModel> {
  const [allEmployees, allLeaveRequests, allDocuments, allAuditLogs] = await Promise.all([
    listEmployees(),
    listLeaveRequests(),
    listDocuments(),
    listAuditLogs(),
  ]);
  const viewerRecord = getEmployeeById(allEmployees, viewer.id) ?? allEmployees[0];

  const visibleRequests = allLeaveRequests
    .filter((request) =>
      canViewLeaveRequest(viewer, request, getEmployeeById(allEmployees, request.employeeId)),
    )
    .map((request) => toLeaveRequestDTO(viewer, request, allEmployees));

  const visibleDocuments = allDocuments
    .filter((document) => canViewDocument(viewer, document))
    .map((document) => toDocumentDTO(document, allEmployees));

  const visibleDirectory = allEmployees
    .filter((employee) => canViewEmployeeProfile(viewer, employee))
    .map((employee) => toSafeEmployeeDTO(employee, allEmployees));

  return {
    activeRoleSlug: getRoleSlugFromViewer(viewer),
    viewer,
    roleOptions: roleOptions.map(({ slug, label }) => ({ slug, label })),
    metrics: getMetrics(viewer, allEmployees, allDocuments, visibleRequests, visibleDocuments, visibleDirectory),
    balances: {
      holidayRemaining: viewerRecord.holidayRemaining,
      holidayAllowance: viewerRecord.holidayAllowance,
      sickDaysUsed: viewerRecord.sickDaysUsed,
      unpaidLeaveUsed: viewerRecord.unpaidLeaveUsed,
    },
    leaveRequests: visibleRequests,
    documents: visibleDocuments,
    directory: visibleDirectory,
    teamCalendar: visibleRequests.map((request) => ({
      id: request.id,
      employeeName: request.employeeName,
      kind: request.kind,
      status: request.status,
      from: request.from,
      to: request.to,
    })),
    adminFinancials: allEmployees
      .filter((employee) => canViewFinancialProfile(viewer, employee))
      .map((employee) => ({
        employeeName: employee.name,
        monthlyRateLabel: formatMoney(
          employee.financialProfile.monthlyRate,
          employee.financialProfile.currency,
        ),
        contractType: titleCase(employee.financialProfile.contractType),
        invoiceCycle: titleCase(employee.financialProfile.invoiceCycle),
      })),
    auditEvents: allAuditLogs.slice(0, 5).map((event) => toAuditEventDTO(event, allEmployees)),
  };
}

function getEmployeeById(
  employees: EmployeeRecord[],
  id: string,
): EmployeeRecord | undefined {
  return employees.find((employee) => employee.id === id);
}

function toSafeEmployeeDTO(
  employee: EmployeeRecord,
  employees: EmployeeRecord[],
): SafeEmployeeDTO {
  const manager = employee.managerId ? getEmployeeById(employees, employee.managerId) : undefined;

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    title: employee.title,
    department: employee.department,
    location: employee.location,
    managerName: manager?.name ?? null,
    startDate: employee.startDate,
    role: employee.role,
    profilePhotoUrl: employee.profilePhotoUrl,
  };
}

function toLeaveRequestDTO(
  viewer: Viewer,
  request: LeaveRequestRecord,
  employees: EmployeeRecord[],
): LeaveRequestDTO {
  const employee = getEmployeeById(employees, request.employeeId);
  const reviewer = request.reviewerId ? getEmployeeById(employees, request.reviewerId) : undefined;

  return {
    id: request.id,
    employeeId: employee?.id ?? request.employeeId,
    employeeName: employee?.name ?? "Unknown employee",
    employeeEmail: employee?.email ?? "unknown@example.com",
    employeeTitle: employee?.title ?? "Unknown role",
    employeeHolidayAllowance: employee?.holidayAllowance ?? 0,
    employeeHolidayRemaining: employee?.holidayRemaining ?? 0,
    kind: request.kind,
    status: request.status,
    from: request.from,
    to: request.to,
    days: request.days,
    requestedAt: request.requestedAt,
    reviewerName: reviewer?.name ?? null,
    canDecide: canDecideLeaveRequest(viewer, request, employee),
  };
}

function toDocumentDTO(
  document: DocumentRecord,
  employees: EmployeeRecord[],
): DocumentDTO {
  const employee = getEmployeeById(employees, document.employeeId);

  return {
    id: document.id,
    employeeId: document.employeeId,
    employeeName: employee?.name ?? "Unknown employee",
    kind: document.kind,
    status: document.status,
    title: document.title,
    period: document.period,
    amountLabel:
      document.amount && document.currency ? formatMoney(document.amount, document.currency) : null,
    issuedAt: document.issuedAt,
  };
}

function getMetrics(
  viewer: Viewer,
  employees: EmployeeRecord[],
  documents: DocumentRecord[],
  requests: LeaveRequestDTO[],
  docs: DocumentDTO[],
  directory: SafeEmployeeDTO[],
): DashboardViewModel["metrics"] {
  const pendingRequests = requests.filter((request) => request.status === "pending").length;
  const approvedDays = requests
    .filter((request) => request.status === "approved")
    .reduce((total, request) => total + request.days, 0);

  if (viewer.role === "master_admin") {
    const invoiceTotal = documents.reduce((total, document) => total + (document.amount ?? 0), 0);

    return [
      {
        label: "Employees",
        value: String(employees.length),
        detail: "Active records",
        tone: "blue",
      },
      {
        label: "Pending leave",
        value: String(pendingRequests),
        detail: "Needs review",
        tone: "amber",
      },
      {
        label: "Monthly invoices",
        value: formatMoney(invoiceTotal, "EUR"),
        detail: "Draft batch",
        tone: "emerald",
      },
      {
        label: "Private documents",
        value: String(documents.length),
        detail: "Access checked",
        tone: "rose",
      },
    ];
  }

  if (viewer.role === "manager") {
    return [
      {
        label: "Team members",
        value: String(Math.max(directory.length - 1, 0)),
        detail: "Direct reports",
        tone: "blue",
      },
      {
        label: "Pending approvals",
        value: String(pendingRequests),
        detail: "Manager queue",
        tone: "amber",
      },
      {
        label: "Approved days",
        value: String(approvedDays),
        detail: "Visible calendar",
        tone: "emerald",
      },
      {
        label: "Financial access",
        value: "0",
        detail: "Team records hidden",
        tone: "zinc",
      },
    ];
  }

  return [
    {
      label: "Holiday left",
      value: String(employees.find((employee) => employee.id === viewer.id)?.holidayRemaining ?? 0),
      detail: "Days available",
      tone: "emerald",
    },
    {
      label: "Sick days",
      value: String(employees.find((employee) => employee.id === viewer.id)?.sickDaysUsed ?? 0),
      detail: "Used this year",
      tone: "blue",
    },
    {
      label: "Unpaid leave",
      value: String(employees.find((employee) => employee.id === viewer.id)?.unpaidLeaveUsed ?? 0),
      detail: "Days used",
      tone: "amber",
    },
    {
      label: "Documents",
      value: String(docs.length),
      detail: "Private files",
      tone: "rose",
    },
  ];
}

function toAuditEventDTO(event: AuditLogRecord, employees: EmployeeRecord[]) {
  const actor = getEmployeeById(employees, event.actorId);

  return {
    id: event.id,
    action: event.action,
    actorName: actor?.name ?? "System",
    targetType: event.targetType,
    createdAt: event.createdAt,
  };
}

function formatMoney(amount: number, currency: "EUR" | "USD" | "GBP"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
