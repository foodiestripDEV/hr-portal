import { decideLeaveRequestForViewer } from "@/lib/hr/commands";
import { getCurrentViewer } from "@/lib/hr/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = await decideLeaveRequestForViewer({
    viewer,
    requestId: id,
    decision: typeof body.decision === "string" ? body.decision : "",
  });

  return Response.json(result, { status: result.ok ? 200 : 403 });
}
