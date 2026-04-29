import Link from "next/link";
import { generateInvoicesAction } from "@/app/actions/hr";
import {
  EmptyState,
  FilterField,
  FilterGrid,
  formatDate,
  Icon,
  invoiceStatusLabels,
  PageHeader,
  Panel,
  PrimaryButton,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../_components";
import {
  getAdminInvoiceRows,
  parseInvoiceFilters,
  type QueryParams,
} from "@/lib/hr/admin-data";

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const params = await searchParams;
  const filters = parseInvoiceFilters(params);
  const invoices = await getAdminInvoiceRows(filters);

  return (
    <>
      <PageHeader eyebrow="Admin Invoices" title="Invoices">
        <form action={generateInvoicesAction} className="flex flex-wrap gap-2">
          <TextInput aria-label="Invoice period" defaultValue="April 2026" name="period" />
          <PrimaryButton>Generate Period</PrimaryButton>
        </form>
      </PageHeader>

      <div className="mt-6 grid gap-5">
        <Panel icon="invoices" title="Filters">
          <form className="mt-5" method="get">
            <FilterGrid>
              <FilterField label="Status">
                <SelectInput defaultValue={filters.status} name="status">
                  <option value="">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </SelectInput>
              </FilterField>
              <FilterField label="Employee">
                <TextInput defaultValue={filters.employee} name="employee" placeholder="Name or email" />
              </FilterField>
              <FilterField label="Generated From">
                <TextInput defaultValue={filters.from} name="from" type="date" />
              </FilterField>
              <FilterField label="Generated To">
                <TextInput defaultValue={filters.to} name="to" type="date" />
              </FilterField>
              <div className="flex items-end">
                <PrimaryButton>Apply Filters</PrimaryButton>
              </div>
            </FilterGrid>
          </form>
        </Panel>

        <Panel icon="invoices" title="Invoice Register">
          <form action="/api/invoices/export" className="mt-5" method="get">
            <input name="status" type="hidden" value={filters.status} />
            <input name="employee" type="hidden" value={filters.employee} />
            <input name="from" type="hidden" value={filters.from} />
            <input name="to" type="hidden" value={filters.to} />
            <div className="mb-4 flex flex-wrap gap-2">
              <PrimaryButton>Export CSV</PrimaryButton>
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
                href={`/api/invoices/export?${toQueryString(filters)}`}
              >
                <Icon name="download" />
                Export Current Filter
              </a>
            </div>

            <div className="overflow-x-auto">
              {invoices.length > 0 ? (
                <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="py-3 pr-4 font-semibold">Select</th>
                      <th className="py-3 pr-4 font-semibold">Employee</th>
                      <th className="py-3 pr-4 font-semibold">Period</th>
                      <th className="py-3 pr-4 font-semibold">Generated</th>
                      <th className="py-3 pr-4 font-semibold">Amount</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr className="border-b border-zinc-100 last:border-0" key={invoice.id}>
                        <td className="py-4 pr-4">
                          <input
                            aria-label={`Select ${invoice.id}`}
                            className="size-4 rounded border-zinc-300"
                            name="selected"
                            type="checkbox"
                            value={invoice.id}
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-zinc-950">{invoice.employeeName}</p>
                          <p className="text-xs text-zinc-500">{invoice.employeeEmail}</p>
                        </td>
                        <td className="py-4 pr-4 text-zinc-600">{invoice.period}</td>
                        <td className="py-4 pr-4 text-zinc-600">{formatDate(invoice.generatedAt)}</td>
                        <td className="py-4 pr-4 font-semibold text-zinc-950">
                          {invoice.amountLabel}
                        </td>
                        <td className="py-4 pr-4">
                          <StatusBadge
                            label={invoiceStatusLabels[invoice.status]}
                            value={invoice.status}
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                              href={`/admin/invoices/${invoice.id}/edit`}
                            >
                              Edit
                            </Link>
                            <a
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                              href={`/api/invoices/${invoice.id}/download`}
                            >
                              <Icon name="download" />
                              Download
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState>No invoices match the selected filters.</EmptyState>
              )}
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}

function toQueryString(filters: {
  status: string;
  employee: string;
  from: string;
  to: string;
}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}
