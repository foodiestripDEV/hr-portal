"use server";

import { revalidatePath } from "next/cache";
import {
  createLeaveRequestForViewer,
  decideLeaveRequestForViewer,
  generateInvoicesForViewer,
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
}

export async function decideLeaveRequestAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await decideLeaveRequestForViewer({
    viewer,
    requestId: getRequiredString(formData, "requestId"),
    decision: getRequiredString(formData, "decision"),
  });

  revalidatePath("/");
}

export async function generateInvoicesAction(formData: FormData): Promise<void> {
  const viewer = await requireCurrentViewer();

  await generateInvoicesForViewer({
    viewer,
    period: getString(formData, "period") ?? null,
  });

  revalidatePath("/");
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
