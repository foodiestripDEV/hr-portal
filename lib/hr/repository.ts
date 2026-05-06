import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { documents, employees, invoices, leaveRequests } from "./mock-data";
import type {
  AuditAction,
  AuditLogRecord,
  DocumentRecord,
  EmployeeRecord,
  InvoiceRecord,
  InvoiceStatus,
  LeaveKind,
  LeaveRequestRecord,
  LeaveStatus,
  Role,
} from "./types";

let employeeTable = employees.map((employee) => ({ ...employee }));
let leaveRequestTable = leaveRequests.map((request) => ({ ...request }));
const documentTable = documents.map((document) => ({ ...document }));
let invoiceTable: InvoiceRecord[] = invoices.map((invoice) => ({ ...invoice }));
let auditLogTable: AuditLogRecord[] = [];
const dataDirectory = path.join(process.cwd(), ".data");
const invoiceStorePath = path.join(dataDirectory, "invoices.json");

export async function listEmployees(): Promise<EmployeeRecord[]> {
  return employeeTable.map(cloneEmployee);
}

export async function listLeaveRequests(): Promise<LeaveRequestRecord[]> {
  return leaveRequestTable.map((request) => ({ ...request }));
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return documentTable.map((document) => ({ ...document }));
}

export async function listInvoices(): Promise<InvoiceRecord[]> {
  await loadInvoiceTable();
  return invoiceTable.map((invoice) => ({ ...invoice }));
}

export async function listAuditLogs(): Promise<AuditLogRecord[]> {
  return auditLogTable.map((event) => ({ ...event, metadata: { ...event.metadata } }));
}

export async function findEmployeeById(id: string): Promise<EmployeeRecord | undefined> {
  const employee = employeeTable.find((item) => item.id === id);
  return employee ? cloneEmployee(employee) : undefined;
}

export async function findEmployeeByEmail(email: string): Promise<EmployeeRecord | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  const employee = employeeTable.find((item) => item.email.toLowerCase() === normalizedEmail);
  return employee ? cloneEmployee(employee) : undefined;
}

export async function findLeaveRequestById(
  id: string,
): Promise<LeaveRequestRecord | undefined> {
  const request = leaveRequestTable.find((item) => item.id === id);
  return request ? { ...request } : undefined;
}

export async function findDocumentById(id: string): Promise<DocumentRecord | undefined> {
  const document = documentTable.find((item) => item.id === id);
  return document ? { ...document } : undefined;
}

export async function findInvoiceById(id: string): Promise<InvoiceRecord | undefined> {
  await loadInvoiceTable();
  const invoice = invoiceTable.find((item) => item.id === id);
  return invoice ? { ...invoice } : undefined;
}

export async function createLeaveRequest(input: {
  employeeId: string;
  kind: LeaveKind;
  from: string;
  to: string;
  days: number;
  actorId: string;
}): Promise<LeaveRequestRecord> {
  const request: LeaveRequestRecord = {
    id: `leave-${Date.now()}`,
    employeeId: input.employeeId,
    kind: input.kind,
    status: "pending",
    from: input.from,
    to: input.to,
    days: input.days,
    requestedAt: today(),
    reviewerId: null,
    decidedAt: null,
    slackThreadId: `pending-slack-${Date.now()}`,
  };

  leaveRequestTable = [request, ...leaveRequestTable];
  await appendAuditLog({
    actorId: input.actorId,
    action: "leave.requested",
    targetType: "leave_request",
    targetId: request.id,
    metadata: {
      employeeId: input.employeeId,
      kind: input.kind,
      days: input.days,
    },
  });

  return { ...request };
}

export async function decideLeaveRequest(input: {
  requestId: string;
  reviewerId: string;
  decision: Extract<LeaveStatus, "approved" | "rejected">;
}): Promise<LeaveRequestRecord> {
  const requestIndex = leaveRequestTable.findIndex((request) => request.id === input.requestId);

  if (requestIndex < 0) {
    throw new Error("Leave request not found.");
  }

  const existing = leaveRequestTable[requestIndex];

  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be decided.");
  }

  const updated: LeaveRequestRecord = {
    ...existing,
    status: input.decision,
    reviewerId: input.reviewerId,
    decidedAt: today(),
  };

  leaveRequestTable = leaveRequestTable.map((request) =>
    request.id === input.requestId ? updated : request,
  );

  if (input.decision === "approved" && updated.kind === "holiday") {
    employeeTable = employeeTable.map((employee) =>
      employee.id === updated.employeeId
        ? {
            ...employee,
            holidayRemaining: Math.max(employee.holidayRemaining - updated.days, 0),
          }
        : employee,
    );
  }

  await appendAuditLog({
    actorId: input.reviewerId,
    action: input.decision === "approved" ? "leave.approved" : "leave.rejected",
    targetType: "leave_request",
    targetId: updated.id,
    metadata: {
      employeeId: updated.employeeId,
      days: updated.days,
    },
  });

  return { ...updated };
}

export async function generateMonthlyInvoices(input: {
  actorId: string;
  month: number;
  year: number;
  amountOverrides?: Record<string, number>;
}): Promise<InvoiceRecord[]> {
  await loadInvoiceTable();
  const generatedAt = today();
  const period = formatInvoicePeriod(input.month, input.year);
  const normalizedPeriod = `${input.year}-${String(input.month).padStart(2, "0")}`;
  const invoices = employeeTable
    .filter((employee) => employee.financialProfile.invoiceCycle === "monthly")
    .map((employee) => {
      const preset = employee.financialProfile.invoicePreset;
      const overrideAmount = input.amountOverrides?.[employee.id];
      const amount = overrideAmount !== undefined ? overrideAmount : preset.defaultAmount;

      return {
        id: `inv-${employee.id}-${normalizedPeriod}`,
        employeeId: employee.id,
        period,
        periodMonth: input.month,
        periodYear: input.year,
        amount,
        currency: employee.financialProfile.currency,
        status: "pending" as const,
        generatedAt,
        pdfStorageKey: `invoices/${employee.id}/${normalizedPeriod}.pdf`,
        presetName: preset.name,
        lineItemDescription: preset.description,
        updatedAt: null,
      };
    });

  const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
  invoiceTable = [
    ...invoices,
    ...invoiceTable.filter((invoice) => !invoiceIds.has(invoice.id)),
  ];
  await saveInvoiceTable();

  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.batch_generated",
    targetType: "invoice_batch",
    targetId: normalizedPeriod,
    metadata: {
      period,
      month: input.month,
      year: input.year,
      count: invoices.length,
    },
  });

  return invoices.map((invoice) => ({ ...invoice }));
}

export async function updateEmployeeProfile(input: {
  actorId: string;
  employeeId: string;
  name: string;
  email: string;
  title: string;
  profilePhotoUrl?: string | null;
}): Promise<EmployeeRecord> {
  const existing = employeeTable.find((employee) => employee.id === input.employeeId);

  if (!existing) {
    throw new Error("Employee not found.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const emailOwner = employeeTable.find(
    (employee) => employee.email.toLowerCase() === normalizedEmail && employee.id !== input.employeeId,
  );

  if (emailOwner) {
    throw new Error("Email already belongs to another employee.");
  }

  employeeTable = employeeTable.map((employee) =>
    employee.id === input.employeeId
      ? {
          ...employee,
          name: input.name,
          email: normalizedEmail,
          title: input.title,
          profilePhotoUrl:
            input.profilePhotoUrl === undefined ? employee.profilePhotoUrl : input.profilePhotoUrl,
        }
      : employee,
  );

  await appendAuditLog({
    actorId: input.actorId,
    action: "employee.profile_updated",
    targetType: "employee",
    targetId: input.employeeId,
    metadata: {
      email: normalizedEmail,
      hasProfilePhoto:
        input.profilePhotoUrl === undefined ? Boolean(existing.profilePhotoUrl) : Boolean(input.profilePhotoUrl),
    },
  });

  const updated = employeeTable.find((employee) => employee.id === input.employeeId);

  if (!updated) {
    throw new Error("Employee not found.");
  }

  return cloneEmployee(updated);
}

export async function updateEmployeeRole(input: {
  actorId: string;
  employeeId: string;
  role: Role;
}): Promise<EmployeeRecord> {
  const employee = employeeTable.find((item) => item.id === input.employeeId);

  if (!employee) {
    throw new Error("Employee not found.");
  }

  employeeTable = employeeTable.map((item) =>
    item.id === input.employeeId ? { ...item, role: input.role } : item,
  );

  await appendAuditLog({
    actorId: input.actorId,
    action: "employee.role_updated",
    targetType: "employee",
    targetId: input.employeeId,
    metadata: {
      role: input.role,
    },
  });

  const updated = employeeTable.find((item) => item.id === input.employeeId);

  if (!updated) {
    throw new Error("Employee not found.");
  }

  return cloneEmployee(updated);
}

export async function recordPasswordResetRequest(input: {
  actorId: string;
  employeeId: string;
}): Promise<void> {
  await appendAuditLog({
    actorId: input.actorId,
    action: "employee.password_reset_requested",
    targetType: "employee",
    targetId: input.employeeId,
    metadata: {},
  });
}

export async function updateInvoiceStatus(input: {
  actorId: string;
  invoiceId: string;
  status: InvoiceStatus;
}): Promise<InvoiceRecord> {
  await loadInvoiceTable();
  const existing = invoiceTable.find((invoice) => invoice.id === input.invoiceId);

  if (!existing) {
    throw new Error("Invoice not found.");
  }

  invoiceTable = invoiceTable.map((invoice) =>
    invoice.id === input.invoiceId
      ? { ...invoice, status: input.status, updatedAt: new Date().toISOString() }
      : invoice,
  );
  await saveInvoiceTable();

  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.status_updated",
    targetType: "invoice",
    targetId: input.invoiceId,
    metadata: {
      status: input.status,
    },
  });

  const updated = invoiceTable.find((invoice) => invoice.id === input.invoiceId);

  if (!updated) {
    throw new Error("Invoice not found.");
  }

  return { ...updated };
}

export async function updateInvoiceAmount(input: {
  actorId: string;
  invoiceId: string;
  amount: number;
}): Promise<InvoiceRecord> {
  await loadInvoiceTable();
  const existing = invoiceTable.find((invoice) => invoice.id === input.invoiceId);

  if (!existing) {
    throw new Error("Invoice not found.");
  }

  invoiceTable = invoiceTable.map((invoice) =>
    invoice.id === input.invoiceId
      ? { ...invoice, amount: input.amount, updatedAt: new Date().toISOString() }
      : invoice,
  );
  await saveInvoiceTable();

  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.status_updated",
    targetType: "invoice",
    targetId: input.invoiceId,
    metadata: {
      amount: input.amount,
    },
  });

  const updated = invoiceTable.find((invoice) => invoice.id === input.invoiceId);

  if (!updated) {
    throw new Error("Invoice not found.");
  }

  return { ...updated };
}

export async function updateInvoiceDetails(input: {
  actorId: string;
  invoiceId: string;
  status: InvoiceStatus;
  amount?: number;
}): Promise<InvoiceRecord> {
  let invoice = await updateInvoiceStatus({
    actorId: input.actorId,
    invoiceId: input.invoiceId,
    status: input.status,
  });

  if (input.amount !== undefined) {
    invoice = await updateInvoiceAmount({
      actorId: input.actorId,
      invoiceId: input.invoiceId,
      amount: input.amount,
    });
  }

  return invoice;
}

export async function recordInvoiceDownload(input: {
  actorId: string;
  invoiceId: string;
}): Promise<void> {
  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.download_requested",
    targetType: "invoice",
    targetId: input.invoiceId,
    metadata: {},
  });
}

export async function recordInvoiceExport(input: {
  actorId: string;
  invoiceIds: string[];
}): Promise<void> {
  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.exported",
    targetType: "invoice_batch",
    targetId: `export-${Date.now()}`,
    metadata: {
      count: input.invoiceIds.length,
    },
  });
}

export async function recordDocumentDownload(input: {
  actorId: string;
  documentId: string;
}): Promise<void> {
  await appendAuditLog({
    actorId: input.actorId,
    action: "document.download_requested",
    targetType: "document",
    targetId: input.documentId,
    metadata: {},
  });
}

export async function recordSlackInteraction(input: {
  actorId: string;
  requestId: string;
  action: AuditAction;
}): Promise<void> {
  await appendAuditLog({
    actorId: input.actorId,
    action: input.action,
    targetType: "slack",
    targetId: input.requestId,
    metadata: {},
  });
}

async function appendAuditLog(input: Omit<AuditLogRecord, "id" | "createdAt">): Promise<void> {
  auditLogTable = [
    {
      id: `audit-${Date.now()}-${auditLogTable.length + 1}`,
      createdAt: new Date().toISOString(),
      ...input,
    },
    ...auditLogTable,
  ];
}

function cloneEmployee(employee: EmployeeRecord): EmployeeRecord {
  return {
    ...employee,
    financialProfile: {
      ...employee.financialProfile,
      invoicePreset: { ...employee.financialProfile.invoicePreset },
    },
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadInvoiceTable(): Promise<void> {
  try {
    const raw = await readFile(invoiceStorePath, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      invoiceTable = parsed.filter(isInvoiceRecord);
    }
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

async function saveInvoiceTable(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(invoiceStorePath, `${JSON.stringify(invoiceTable, null, 2)}\n`, "utf8");
}

function isInvoiceRecord(value: unknown): value is InvoiceRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const invoice = value as Partial<InvoiceRecord>;
  return (
    typeof invoice.id === "string" &&
    typeof invoice.employeeId === "string" &&
    typeof invoice.period === "string" &&
    typeof invoice.periodMonth === "number" &&
    typeof invoice.periodYear === "number" &&
    typeof invoice.amount === "number" &&
    (invoice.currency === "EUR" || invoice.currency === "USD" || invoice.currency === "GBP") &&
    (invoice.status === "pending" || invoice.status === "paid") &&
    typeof invoice.generatedAt === "string" &&
    typeof invoice.pdfStorageKey === "string" &&
    typeof invoice.presetName === "string" &&
    typeof invoice.lineItemDescription === "string"
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

function formatInvoicePeriod(month: number, year: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
