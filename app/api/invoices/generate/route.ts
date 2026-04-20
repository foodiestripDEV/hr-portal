import { generateInvoicesForViewer } from "@/lib/hr/commands";
import { getCurrentViewer } from "@/lib/hr/session";

export async function POST(request: Request) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await generateInvoicesForViewer({
    viewer,
    period: typeof body.period === "string" ? body.period : null,
  });

  return Response.json(result, { status: result.ok ? 201 : 403 });
}
