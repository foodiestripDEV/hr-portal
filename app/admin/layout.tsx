import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components";
import { isMasterAdmin } from "@/lib/hr/access-control";
import { requireCurrentViewer } from "@/lib/hr/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireCurrentViewer();

  if (!isMasterAdmin(viewer)) {
    redirect("/");
  }

  return <AdminShell viewer={viewer}>{children}</AdminShell>;
}
