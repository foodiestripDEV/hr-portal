import { createDocumentDownloadForViewer } from "@/lib/hr/commands";
import { getCurrentViewer } from "@/lib/hr/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await createDocumentDownloadForViewer({
    viewer,
    documentId: id,
  });

  return Response.json(result, { status: result.ok ? 200 : 403 });
}
