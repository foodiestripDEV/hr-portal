import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvoiceStatusAction } from "@/app/actions/hr";
import {
  formatDate,
  invoiceStatusLabels,
  PageHeader,
  Panel,
  PrimaryButton,
  SelectInput,
  StatusBadge,
} from "../../../_components";
import { getAdminInvoiceRows, parseInvoiceFilters } from "@/lib/hr/admin-data";

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const invoices = await getAdminInvoiceRows(parseInvoiceFilters({}));
  const invoice = invoices.find((item) => item.id === id);

  if (!invoice) {
    notFound();
  }

  return (
    <>
      <PageHeader eyebrow="Admin Invoices" title="Edit Invoice">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
          href="/admin/invoices"
        >
          Back to Invoices
        </Link>
      </PageHeader>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
        {getParam(query.saved) ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 xl:col-span-2">
            Invoice changes saved.
          </div>
        ) : null}

        <Panel icon="invoices" title={invoice.period}>
          <div className="mt-5 grid gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Employee</p>
              <p className="mt-1 font-semibold text-zinc-950">{invoice.employeeName}</p>
              <p className="text-zinc-500">{invoice.employeeEmail}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Generated</p>
              <p className="mt-1 text-zinc-700">{formatDate(invoice.generatedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preset</p>
              <p className="mt-1 font-semibold text-zinc-950">{invoice.presetName}</p>
              <p className="text-zinc-500">{invoice.lineItemDescription}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Amount</p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">{invoice.amountLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Current Status</p>
              <div className="mt-2">
                <StatusBadge label={invoiceStatusLabels[invoice.status]} value={invoice.status} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Update Status">
          <form action={updateInvoiceStatusAction} className="mt-5 grid gap-3">
            <input name="invoiceId" type="hidden" value={invoice.id} />
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Status
              <SelectInput defaultValue={invoice.status} name="status">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </SelectInput>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Invoice Amount
              <input
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                defaultValue={invoice.amount}
                min="0"
                name="amount"
                type="number"
              />
            </label>
            <p className="text-xs text-zinc-500">
              This changes only this invoice period, not the employee's default salary preset.
            </p>
            <PrimaryButton>Save Invoice</PrimaryButton>
          </form>
          <a
            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
            href={`/api/invoices/${invoice.id}/download`}
          >
            Download
          </a>
        </Panel>
      </div>
    </>
  );
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
