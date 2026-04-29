"use server";

import { revalidatePath } from "next/cache";
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

  await generateInvoicesForViewer({
    viewer,
    period: getString(formData, "period") ?? null,
  });

  revalidatePath("/");
  revalidatePath("/admin/invoices");
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

  await updateInvoiceStatusForViewer({
    viewer,
    invoiceId: getRequiredString(formData, "invoiceId"),
    status: getRequiredString(formData, "status"),
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${getRequiredString(formData, "invoiceId")}/edit`);
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
