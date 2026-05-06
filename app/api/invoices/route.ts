import { canViewFinancialProfile } from "@/lib/hr/access-control";
import { updateInvoiceStatusForViewer } from "@/lib/hr/commands";
import { listEmployees, listInvoices } from "@/lib/hr/repository";
import { getCurrentViewer } from "@/lib/hr/session";

export async function GET() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const [employees, invoices] = await Promise.all([listEmployees(), listInvoices()]);
  const visibleInvoices = invoices.filter((invoice) => {
    const employee = employees.find((item) => item.id === invoice.employeeId);
    return employee ? canViewFinancialProfile(viewer, employee) : false;
  });

  return Response.json({ ok: true, invoices: visibleInvoices });
}

export async function PATCH(request: Request) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await updateInvoiceStatusForViewer({
    viewer,
    invoiceId: typeof body.invoiceId === "string" ? body.invoiceId : "",
    status: typeof body.status === "string" ? body.status : "",
    amount: typeof body.amount === "number" ? body.amount : null,
  });

  return Response.json(result, { status: result.ok ? 200 : 403 });
}
