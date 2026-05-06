"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLeaveRequestForViewer,
  decideLeaveRequestForViewer,
  generateInvoicesForViewer,
  requestPasswordResetForViewer,
  updatePersonalInfoForViewer,
  updateEmployeeRoleForViewer,
  updateInvoiceStatusForViewer,
} from "@/lib/hr/commands";
import { requireCurrentViewer } from "@/lib/hr/session";

export async function createLeaveRequestAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await createLeaveRequestForViewer({
    viewer,
    employeeId: getString(formData, "employeeId"),
    kind: getString(formData, "kind") ?? null,
    from: getString(formData, "from") ?? null,
    to: getString(formData, "to") ?? null,
  });

  revalidatePath("/");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/calendar");
}

export async function updatePersonalInfoAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();
  const profilePhoto = formData.get("profilePhoto");

  await updatePersonalInfoForViewer({
    viewer,
    name: getString(formData, "name") ?? null,
    email: getString(formData, "email") ?? null,
    title: getString(formData, "title") ?? null,
    profilePhoto: profilePhoto instanceof File ? profilePhoto : null,
    removeAvatar: getString(formData, "removeAvatar") === "true",
  });

  revalidatePath("/");
}

export async function decideLeaveRequestAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await decideLeaveRequestForViewer({
    viewer,
    requestId: getRequiredString(formData, "requestId"),
    decision: getRequiredString(formData, "decision"),
  });

  revalidatePath("/");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/calendar");
}

export async function generateInvoicesAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();
  const month = getNumber(formData, "month");
  const year = getNumber(formData, "year");

  const result = await generateInvoicesForViewer({
    viewer,
    period: getString(formData, "period") ?? null,
    month,
    year,
    amountOverrides: getAmountOverrides(formData),
  });

  revalidatePath("/");
  revalidatePath("/admin/invoices");

  if (result.ok && "invoices" in result) {
    const params = new URLSearchParams({
      status: "pending",
      generated: formatGeneratedPeriod(month, year),
      month: month ? String(month) : "",
      year: year ? String(year) : "",
      count: String(result.invoices.length),
    });

    redirect(`/admin/invoices?${params.toString()}`);
  }
}

export async function updateEmployeeRoleAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await updateEmployeeRoleForViewer({
    viewer,
    employeeId: getRequiredString(formData, "employeeId"),
    role: getRequiredString(formData, "role"),
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await requestPasswordResetForViewer({
    viewer,
    employeeId: getRequiredString(formData, "employeeId"),
  });

  revalidatePath("/admin");
}

export async function updateInvoiceStatusAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();
  const invoiceId = getRequiredString(formData, "invoiceId");

  await updateInvoiceStatusForViewer({
    viewer,
    invoiceId,
    status: getRequiredString(formData, "status"),
    amount: getNumber(formData, "amount"),
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}/edit`);

  redirect(`/admin/invoices/${invoiceId}/edit?saved=1`);
}

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getRequiredString(formData: FormData, key: string): string {
  const value = getString(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function getNumber(formData: FormData, key: string): number | null {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getAmountOverrides(formData: FormData): Record<string, number> {
  const overrides: Record<string, number> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("amountOverride:") || typeof value !== "string" || value.trim() === "") {
      continue;
    }

    const amount = Number(value);

    if (Number.isFinite(amount) && amount >= 0) {
      overrides[key.slice("amountOverride:".length)] = amount;
    }
  }

  return overrides;
}

function formatGeneratedPeriod(month: number | null, year: number | null): string {
  if (!month || !year) {
    return "Selected period";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
