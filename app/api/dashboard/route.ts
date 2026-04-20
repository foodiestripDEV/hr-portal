import { getDashboardViewModel } from "@/lib/hr/dashboard";
import { getCurrentViewer } from "@/lib/hr/session";

export async function GET() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const dashboard = await getDashboardViewModel(viewer);

  return Response.json({ dashboard });
}
