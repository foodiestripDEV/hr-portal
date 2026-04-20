import {
  canCreateLeaveRequest,
  canDecideLeaveRequest,
  canGenerateInvoices,
  canViewDocument,
} from "./access-control";
import {
  createLeaveRequest,
  decideLeaveRequest,
  findDocumentById,
  findEmployeeById,
  findLeaveRequestById,
  generateMonthlyInvoices,
  recordDocumentDownload,
} from "./repository";
import type { ActionResult, InvoiceRecord, LeaveKind, LeaveStatus, Viewer } from "./types";

export async function createLeaveRequestForViewer(input: {
  viewer: Viewer;
  employeeId?: string;
  kind: string | null;
  from: string | null;
  to: string | null;
}): Promise<ActionResult> {
  const employeeId = input.employeeId || input.viewer.id;
  const employee = await findEmployeeById(employeeId);

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  if (!canCreateLeaveRequest(input.viewer, employee.id)) {
    return { ok: false, message: "You are not allowed to create this leave request." };
  }

  if (!isLeaveKind(input.kind)) {
    return { ok: false, message: "Invalid leave type." };
  }

  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to);

  if (!from || !to || from > to) {
    return { ok: false, message: "Invalid leave dates." };
  }

  await createLeaveRequest({
    actorId: input.viewer.id,
    employeeId: employee.id,
    kind: input.kind,
    from: formatDateInput(from),
    to: formatDateInput(to),
    days: countBusinessDays(from, to),
  });

  return { ok: true, message: "Leave request created." };
}

export async function decideLeaveRequestForViewer(input: {
  viewer: Viewer;
  requestId: string;
  decision: string;
}): Promise<ActionResult> {
  const request = await findLeaveRequestById(input.requestId);

  if (!request) {
    return { ok: false, message: "Leave request not found." };
  }

  const employee = await findEmployeeById(request.employeeId);

  if (!canDecideLeaveRequest(input.viewer, request, employee)) {
    return { ok: false, message: "You are not allowed to decide this request." };
  }

  if (!isLeaveDecision(input.decision)) {
    return { ok: false, message: "Invalid leave decision." };
  }

  await decideLeaveRequest({
    requestId: request.id,
    reviewerId: input.viewer.id,
    decision: input.decision,
  });

  return {
    ok: true,
    message: input.decision === "approved" ? "Leave request approved." : "Leave request rejected.",
  };
}

export async function createDocumentDownloadForViewer(input: {
  viewer: Viewer;
  documentId: string;
}): Promise<
  | {
      ok: true;
      url: string;
      expiresAt: string;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const document = await findDocumentById(input.documentId);

  if (!document) {
    return { ok: false, message: "Document not found." };
  }

  if (!canViewDocument(input.viewer, document)) {
    return { ok: false, message: "You are not allowed to download this document." };
  }

  await recordDocumentDownload({
    actorId: input.viewer.id,
    documentId: document.id,
  });

  return {
    ok: true,
    url: `/api/private-files/${encodeURIComponent(document.privateStorageKey)}?token=demo-signed-token`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

export async function generateInvoicesForViewer(input: {
  viewer: Viewer;
  period: string | null;
}): Promise<
  | {
      ok: true;
      message: string;
      invoices: InvoiceRecord[];
    }
  | ActionResult
> {
  const period = input.period?.trim();

  if (!canGenerateInvoices(input.viewer)) {
    return { ok: false, message: "Only HR/CEO can generate invoices." };
  }

  if (!period) {
    return { ok: false, message: "Invoice period is required." };
  }

  const invoices = await generateMonthlyInvoices({
    actorId: input.viewer.id,
    period,
  });

  return {
    ok: true,
    message: `${invoices.length} draft invoices generated.`,
    invoices,
  };
}

function isLeaveKind(value: string | null): value is LeaveKind {
  return value === "holiday" || value === "sick" || value === "unpaid";
}

function isLeaveDecision(value: string): value is Extract<LeaveStatus, "approved" | "rejected"> {
  return value === "approved" || value === "rejected";
}

function parseDateInput(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countBusinessDays(from: Date, to: Date): number {
  let days = 0;
  const cursor = new Date(from);

  while (cursor <= to) {
    const day = cursor.getUTCDay();

    if (day !== 0 && day !== 6) {
      days += 1;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return Math.max(days, 1);
}
