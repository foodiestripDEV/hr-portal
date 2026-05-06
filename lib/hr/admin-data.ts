import {
  listDocuments,
  listEmployees,
  listInvoices,
  listLeaveRequests,
} from "./repository";
import type {
  DocumentKind,
  DocumentStatus,
  EmployeeRecord,
  InvoiceStatus,
  LeaveStatus,
  Role,
} from "./types";

export type QueryParams = Record<string, string | string[] | undefined>;

export type AdminRequestFilters = {
  status: LeaveStatus | "";
  employee: string;
  reviewer: string;
  from: string;
  to: string;
};

export type AdminDocumentFilters = {
  status: DocumentStatus | "";
  employee: string;
  kind: DocumentKind | "";
  from: string;
  to: string;
};

export type AdminInvoiceFilters = {
  status: InvoiceStatus | "";
  employee: string;
  from: string;
  to: string;
  selected: string[];
};

export type AdminRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeTitle: string;
  balanceLabel: string;
  kind: string;
  status: LeaveStatus;
  from: string;
  to: string;
  days: number;
  requestedAt: string;
  reviewerName: string;
  reviewerDetail: string;
  canDecide: boolean;
};

export type AdminDocumentRow = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  kind: DocumentKind;
  status: DocumentStatus;
  title: string;
  period: string;
  amountLabel: string | null;
  issuedAt: string;
};

export type AdminInvoiceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  period: string;
  amountLabel: string;
  amount: number;
  currency: "EUR" | "USD" | "GBP";
  status: InvoiceStatus;
  generatedAt: string;
  pdfStorageKey: string;
  presetName: string;
  lineItemDescription: string;
  isPartTime: boolean;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  location: string;
  managerName: string;
  holidayAllowance: number;
  holidayRemaining: number;
  sickDaysUsed: number;
  unpaidLeaveUsed: number;
  profilePhotoUrl: string | null;
};

export type InvoiceGenerationPresetRow = {
  employeeId: string;
  employeeName: string;
  presetName: string;
  description: string;
  defaultAmountLabel: string;
  defaultAmount: number;
};

export function parseRequestFilters(params: QueryParams): AdminRequestFilters {
  const status = getOne(params.status);

  return {
    status: isLeaveStatus(status) ? status : "",
    employee: getOne(params.employee),
    reviewer: getOne(params.reviewer),
    from: getOne(params.from),
    to: getOne(params.to),
  };
}

export function parseDocumentFilters(params: QueryParams): AdminDocumentFilters {
  const status = getOne(params.status);
  const kind = getOne(params.kind);

  return {
    status: isDocumentStatus(status) ? status : "",
    employee: getOne(params.employee),
    kind: isDocumentKind(kind) ? kind : "",
    from: getOne(params.from),
    to: getOne(params.to),
  };
}

export function parseInvoiceFilters(params: QueryParams): AdminInvoiceFilters {
  const status = getOne(params.status);

  return {
    status: isInvoiceStatus(status) ? status : "",
    employee: getOne(params.employee),
    from: getOne(params.from),
    to: getOne(params.to),
    selected: getMany(params.selected),
  };
}

export async function getAdminRequestRows(
  filters: AdminRequestFilters,
): Promise<AdminRequestRow[]> {
  const [employees, requests] = await Promise.all([listEmployees(), listLeaveRequests()]);

  return requests
    .map((request) => {
      const employee = findEmployee(employees, request.employeeId);
      const reviewer = request.reviewerId ? findEmployee(employees, request.reviewerId) : undefined;
      const pendingReviewer = employee?.managerId ? findEmployee(employees, employee.managerId) : undefined;

      return {
        id: request.id,
        employeeId: request.employeeId,
        employeeName: employee?.name ?? "Unknown employee",
        employeeEmail: employee?.email ?? "unknown@example.com",
        employeeTitle: employee?.title ?? "Unknown role",
        balanceLabel: employee
          ? `${employee.holidayRemaining}/${employee.holidayAllowance} days`
          : "Unknown",
        kind: titleCase(request.kind),
        status: request.status,
        from: request.from,
        to: request.to,
        days: request.days,
        requestedAt: request.requestedAt,
        reviewerName: reviewer?.name ?? pendingReviewer?.name ?? "HR / CEO",
        reviewerDetail: reviewer ? "Approved by" : "Review owner",
        canDecide: request.status === "pending",
      };
    })
    .filter((row) => {
      return (
        matchesStatus(row.status, filters.status) &&
        matchesText(`${row.employeeName} ${row.employeeEmail}`, filters.employee) &&
        matchesText(row.reviewerName, filters.reviewer) &&
        overlapsDateRange(row.from, row.to, filters.from, filters.to)
      );
    });
}

export async function getAdminDocumentRows(
  filters: AdminDocumentFilters,
): Promise<AdminDocumentRow[]> {
  const [employees, documents] = await Promise.all([listEmployees(), listDocuments()]);

  return documents
    .map((document) => {
      const employee = findEmployee(employees, document.employeeId);

      return {
        id: document.id,
        employeeName: employee?.name ?? "Unknown employee",
        employeeEmail: employee?.email ?? "unknown@example.com",
        kind: document.kind,
        status: document.status,
        title: document.title,
        period: document.period,
        amountLabel:
          document.amount && document.currency ? formatMoney(document.amount, document.currency) : null,
        issuedAt: document.issuedAt,
      };
    })
    .filter((row) => {
      return (
        matchesStatus(row.status, filters.status) &&
        matchesText(`${row.employeeName} ${row.employeeEmail}`, filters.employee) &&
        (!filters.kind || row.kind === filters.kind) &&
        matchesDateRange(row.issuedAt, filters.from, filters.to)
      );
    });
}

export async function getAdminInvoiceRows(
  filters: AdminInvoiceFilters,
): Promise<AdminInvoiceRow[]> {
  const [employees, invoices] = await Promise.all([listEmployees(), listInvoices()]);

  return invoices
    .map((invoice) => {
      const employee = findEmployee(employees, invoice.employeeId);

      return {
        id: invoice.id,
        employeeId: invoice.employeeId,
        employeeName: employee?.name ?? "Unknown employee",
        employeeEmail: employee?.email ?? "unknown@example.com",
        period: invoice.period,
        amountLabel: formatMoney(invoice.amount, invoice.currency),
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        generatedAt: invoice.generatedAt,
        pdfStorageKey: invoice.pdfStorageKey,
        presetName: invoice.presetName,
        lineItemDescription: invoice.lineItemDescription,
        isPartTime: employee?.financialProfile.employmentType === "part_time",
      };
    })
    .filter((row) => {
      return (
        matchesStatus(row.status, filters.status) &&
        matchesText(`${row.employeeName} ${row.employeeEmail}`, filters.employee) &&
        matchesDateRange(row.generatedAt, filters.from, filters.to) &&
        (filters.selected.length === 0 || filters.selected.includes(row.id))
      );
    });
}

export async function getAdminUserRows(): Promise<AdminUserRow[]> {
  const employees = await listEmployees();

  return employees.map((employee) => {
    const manager = employee.managerId ? findEmployee(employees, employee.managerId) : undefined;

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      title: employee.title,
      department: employee.department,
      location: employee.location,
      managerName: manager?.name ?? "No manager",
      holidayAllowance: employee.holidayAllowance,
      holidayRemaining: employee.holidayRemaining,
      sickDaysUsed: employee.sickDaysUsed,
      unpaidLeaveUsed: employee.unpaidLeaveUsed,
      profilePhotoUrl: employee.profilePhotoUrl,
    };
  });
}

export async function getInvoiceGenerationPresetRows(): Promise<InvoiceGenerationPresetRow[]> {
  const employees = await listEmployees();

  return employees
    .filter((employee) => employee.financialProfile.invoiceCycle === "monthly")
    .map((employee) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      presetName: employee.financialProfile.invoicePreset.name,
      description: employee.financialProfile.invoicePreset.description,
      defaultAmountLabel: formatMoney(
        employee.financialProfile.invoicePreset.defaultAmount,
        employee.financialProfile.currency,
      ),
      defaultAmount: employee.financialProfile.invoicePreset.defaultAmount,
    }));
}

export function getOne(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function getMany(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

export function formatMoney(amount: number, currency: "EUR" | "USD" | "GBP"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function findEmployee(
  employees: EmployeeRecord[],
  employeeId: string,
): EmployeeRecord | undefined {
  return employees.find((employee) => employee.id === employeeId);
}

function matchesStatus<T extends string>(value: T, filter: T | ""): boolean {
  return !filter || value === filter;
}

function matchesText(value: string, filter: string): boolean {
  return !filter || value.toLowerCase().includes(filter.trim().toLowerCase());
}

function matchesDateRange(value: string, from: string, to: string): boolean {
  if (from && value < from) {
    return false;
  }

  if (to && value > to) {
    return false;
  }

  return true;
}

function overlapsDateRange(start: string, end: string, from: string, to: string): boolean {
  if (from && end < from) {
    return false;
  }

  if (to && start > to) {
    return false;
  }

  return true;
}

function isLeaveStatus(value: string): value is LeaveStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isDocumentStatus(value: string): value is DocumentStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return value === "pending" || value === "paid";
}

function isDocumentKind(value: string): value is DocumentKind {
  return value === "invoice" || value === "official" || value === "private" || value === "contract";
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
