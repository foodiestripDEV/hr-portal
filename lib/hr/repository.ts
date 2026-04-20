import { documents, employees, leaveRequests } from "./mock-data";
import type {
  AuditAction,
  AuditLogRecord,
  DocumentRecord,
  EmployeeRecord,
  InvoiceRecord,
  LeaveKind,
  LeaveRequestRecord,
  LeaveStatus,
} from "./types";

let employeeTable = employees.map((employee) => ({ ...employee }));
let leaveRequestTable = leaveRequests.map((request) => ({ ...request }));
const documentTable = documents.map((document) => ({ ...document }));
let invoiceTable: InvoiceRecord[] = [];
let auditLogTable: AuditLogRecord[] = [];

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
  period: string;
}): Promise<InvoiceRecord[]> {
  const generatedAt = today();
  const invoices = employeeTable
    .filter((employee) => employee.financialProfile.contractType === "contractor")
    .map((employee) => {
      const normalizedPeriod = input.period.toLowerCase().replaceAll(" ", "-");

      return {
        id: `inv-${employee.id}-${normalizedPeriod}`,
        employeeId: employee.id,
        period: input.period,
        amount: employee.financialProfile.monthlyRate,
        currency: employee.financialProfile.currency,
        status: "draft" as const,
        generatedAt,
        pdfStorageKey: `invoices/${employee.id}/${normalizedPeriod}.pdf`,
      };
    });

  const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
  invoiceTable = [
    ...invoices,
    ...invoiceTable.filter((invoice) => !invoiceIds.has(invoice.id)),
  ];

  await appendAuditLog({
    actorId: input.actorId,
    action: "invoice.batch_generated",
    targetType: "invoice_batch",
    targetId: input.period,
    metadata: {
      period: input.period,
      count: invoices.length,
    },
  });

  return invoices.map((invoice) => ({ ...invoice }));
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
    financialProfile: { ...employee.financialProfile },
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
