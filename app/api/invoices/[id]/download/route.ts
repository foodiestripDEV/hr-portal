import { createInvoiceDownloadForViewer } from "@/lib/hr/commands";
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
  const result = await createInvoiceDownloadForViewer({
    viewer,
    invoiceId: id,
  });

  if (!result.ok) {
    return Response.json(result, { status: 403 });
  }

  return new Response(result.body, {
    headers: {
      "content-disposition": `attachment; filename=${result.filename}`,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
