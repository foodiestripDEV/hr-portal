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
    month: typeof body.month === "number" ? body.month : null,
    year: typeof body.year === "number" ? body.year : null,
    amountOverrides: isAmountOverrideMap(body.amountOverrides) ? body.amountOverrides : undefined,
  });

  return Response.json(result, { status: result.ok ? 201 : 403 });
}

function isAmountOverrideMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((amount) => typeof amount === "number" && Number.isFinite(amount));
}
