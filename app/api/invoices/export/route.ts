import { getAdminInvoiceRows, parseInvoiceFilters } from "@/lib/hr/admin-data";
import { isMasterAdmin } from "@/lib/hr/access-control";
import { recordInvoiceExport } from "@/lib/hr/repository";
import { getCurrentViewer } from "@/lib/hr/session";

export async function GET(request: Request) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!isMasterAdmin(viewer)) {
    return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parseInvoiceFilters({
    status: url.searchParams.get("status") ?? undefined,
    employee: url.searchParams.get("employee") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    selected: url.searchParams.getAll("selected"),
  });
  const rows = await getAdminInvoiceRows(filters);

  await recordInvoiceExport({
    actorId: viewer.id,
    invoiceIds: rows.map((row) => row.id),
  });

  return new Response(toCsv(rows), {
    headers: {
      "content-disposition": "attachment; filename=hr-invoices.csv",
      "content-type": "text/csv; charset=utf-8",
    },
  });
}

function toCsv(
  rows: Array<{
    id: string;
    employeeName: string;
    employeeEmail: string;
    period: string;
    amountLabel: string;
    status: string;
    generatedAt: string;
  }>,
): string {
  const header = ["id", "employee", "email", "period", "amount", "status", "generatedAt"];
  const body = rows.map((row) => [
    row.id,
    row.employeeName,
    row.employeeEmail,
    row.period,
    row.amountLabel,
    row.status,
    row.generatedAt,
  ]);

  return [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
