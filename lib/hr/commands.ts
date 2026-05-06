import {
  canCreateLeaveRequest,
  canDecideLeaveRequest,
  canGenerateInvoices,
  canManageEmployees,
  canManageInvoices,
  canViewDocument,
  canViewFinancialProfile,
} from "./access-control";
import {
  createLeaveRequest,
  decideLeaveRequest,
  findDocumentById,
  findEmployeeById,
  findInvoiceById,
  findLeaveRequestById,
  generateMonthlyInvoices,
  recordDocumentDownload,
  recordInvoiceDownload,
  recordPasswordResetRequest,
  updateInvoiceDetails,
  updateEmployeeProfile,
  updateEmployeeRole,
} from "./repository";
import type {
  ActionResult,
  InvoiceRecord,
  InvoiceStatus,
  LeaveKind,
  LeaveStatus,
  Role,
  Viewer,
} from "./types";

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

export async function updatePersonalInfoForViewer(input: {
  viewer: Viewer;
  name: string | null;
  email: string | null;
  title: string | null;
  profilePhoto: File | null;
  removeAvatar: boolean;
}): Promise<ActionResult> {
  const employee = await findEmployeeById(input.viewer.id);

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const title = input.title?.trim() ?? "";

  if (!name || !email || !title) {
    return { ok: false, message: "Name, email, and job title are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Invalid email address." };
  }

  let profilePhotoUrl: string | null | undefined;

  if (input.removeAvatar) {
    profilePhotoUrl = null;
  } else if (input.profilePhoto && input.profilePhoto.size > 0) {
    if (!input.profilePhoto.type.startsWith("image/")) {
      return { ok: false, message: "Profile photo must be an image file." };
    }

    if (input.profilePhoto.size > 2 * 1024 * 1024) {
      return { ok: false, message: "Profile photo must be 2 MB or smaller." };
    }

    const bytes = Buffer.from(await input.profilePhoto.arrayBuffer());
    profilePhotoUrl = `data:${input.profilePhoto.type};base64,${bytes.toString("base64")}`;
  }

  await updateEmployeeProfile({
    actorId: input.viewer.id,
    employeeId: employee.id,
    name,
    email,
    title,
    profilePhotoUrl,
  });

  return { ok: true, message: "Personal information updated." };
}

export async function generateInvoicesForViewer(input: {
  viewer: Viewer;
  period: string | null;
  month?: number | null;
  year?: number | null;
  amountOverrides?: Record<string, number>;
}): Promise<
  | {
      ok: true;
      message: string;
      invoices: InvoiceRecord[];
    }
  | ActionResult
> {
  if (!canGenerateInvoices(input.viewer)) {
    return { ok: false, message: "Only HR/CEO can generate invoices." };
  }

  const periodParts = resolveInvoicePeriod({
    period: input.period,
    month: input.month,
    year: input.year,
  });

  if (!periodParts) {
    return { ok: false, message: "Valid invoice month and year are required." };
  }

  const invoices = await generateMonthlyInvoices({
    actorId: input.viewer.id,
    month: periodParts.month,
    year: periodParts.year,
    amountOverrides: input.amountOverrides,
  });

  return {
    ok: true,
    message: `${invoices.length} pending invoices generated.`,
    invoices,
  };
}

export async function updateEmployeeRoleForViewer(input: {
  viewer: Viewer;
  employeeId: string;
  role: string;
}): Promise<ActionResult> {
  if (!canManageEmployees(input.viewer)) {
    return { ok: false, message: "Only HR/CEO can update employee roles." };
  }

  if (!isRole(input.role)) {
    return { ok: false, message: "Invalid role." };
  }

  await updateEmployeeRole({
    actorId: input.viewer.id,
    employeeId: input.employeeId,
    role: input.role,
  });

  return { ok: true, message: "Employee role updated." };
}

export async function requestPasswordResetForViewer(input: {
  viewer: Viewer;
  employeeId: string;
}): Promise<ActionResult> {
  if (!canManageEmployees(input.viewer)) {
    return { ok: false, message: "Only HR/CEO can reset employee passwords." };
  }

  const employee = await findEmployeeById(input.employeeId);

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  await recordPasswordResetRequest({
    actorId: input.viewer.id,
    employeeId: employee.id,
  });

  return { ok: true, message: "Password reset request recorded." };
}

export async function updateInvoiceStatusForViewer(input: {
  viewer: Viewer;
  invoiceId: string;
  status: string;
  amount?: number | null;
}): Promise<ActionResult> {
  if (!canManageInvoices(input.viewer)) {
    return { ok: false, message: "Only HR/CEO can update invoices." };
  }

  if (!isInvoiceStatus(input.status)) {
    return { ok: false, message: "Invalid invoice status." };
  }

  const invoice = await findInvoiceById(input.invoiceId);

  if (!invoice) {
    return { ok: false, message: "Invoice not found." };
  }

  const amount = input.amount !== null && input.amount !== undefined ? input.amount : undefined;

  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
    return { ok: false, message: "Invalid invoice amount." };
  }

  await updateInvoiceDetails({
    actorId: input.viewer.id,
    invoiceId: input.invoiceId,
    status: input.status,
    amount,
  });

  return { ok: true, message: "Invoice status updated." };
}

export async function createInvoiceDownloadForViewer(input: {
  viewer: Viewer;
  invoiceId: string;
}): Promise<
  | {
      ok: true;
      filename: string;
      body: string;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const invoice = await findInvoiceById(input.invoiceId);

  if (!invoice) {
    return { ok: false, message: "Invoice not found." };
  }

  const employee = await findEmployeeById(invoice.employeeId);

  if (!employee || !canViewFinancialProfile(input.viewer, employee)) {
    return { ok: false, message: "You are not allowed to download this invoice." };
  }

  await recordInvoiceDownload({
    actorId: input.viewer.id,
    invoiceId: invoice.id,
  });

  return {
    ok: true,
    filename: `${invoice.id}.txt`,
    body: [
      "Invoice download placeholder",
      `Invoice: ${invoice.id}`,
      `Employee: ${employee.name}`,
      `Period: ${invoice.period}`,
      `Status: ${invoice.status}`,
      `Amount: ${invoice.amount} ${invoice.currency}`,
      `Storage key: ${invoice.pdfStorageKey}`,
    ].join("\n"),
  };
}

function isLeaveKind(value: string | null): value is LeaveKind {
  return value === "holiday" || value === "sick" || value === "unpaid";
}

function isLeaveDecision(value: string): value is Extract<LeaveStatus, "approved" | "rejected"> {
  return value === "approved" || value === "rejected";
}

function isRole(value: string): value is Role {
  return value === "master_admin" || value === "manager" || value === "employee";
}

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return value === "pending" || value === "paid";
}

function resolveInvoicePeriod(input: {
  period: string | null;
  month?: number | null;
  year?: number | null;
}): { month: number; year: number } | null {
  if (isValidInvoiceMonth(input.month) && isValidInvoiceYear(input.year)) {
    return { month: input.month, year: input.year };
  }

  const period = input.period?.trim();

  if (!period) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{1,2})$/.exec(period);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    return isValidInvoiceMonth(month) && isValidInvoiceYear(year) ? { month, year } : null;
  }

  const parsed = new Date(`${period} 1, 00:00:00 UTC`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const month = parsed.getUTCMonth() + 1;
  const year = parsed.getUTCFullYear();

  return isValidInvoiceYear(year) ? { month, year } : null;
}

function isValidInvoiceMonth(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidInvoiceYear(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 2000 && value <= 2100;
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
