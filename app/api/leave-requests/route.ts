import { createLeaveRequestForViewer } from "@/lib/hr/commands";
import { getDashboardViewModel } from "@/lib/hr/dashboard";
import { getCurrentViewer } from "@/lib/hr/session";

export async function GET() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const dashboard = await getDashboardViewModel(viewer);

  return Response.json({ leaveRequests: dashboard.leaveRequests });
}

export async function POST(request: Request) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await createLeaveRequestForViewer({
    viewer,
    employeeId: typeof body.employeeId === "string" ? body.employeeId : undefined,
    kind: typeof body.kind === "string" ? body.kind : null,
    from: typeof body.from === "string" ? body.from : null,
    to: typeof body.to === "string" ? body.to : null,
  });

  return Response.json(result, { status: result.ok ? 201 : 400 });
}
