import {
  documentKindLabels,
  documentStatusLabels,
  EmptyState,
  FilterField,
  FilterGrid,
  formatDate,
  Icon,
  PageHeader,
  Panel,
  PrimaryButton,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../_components";
import {
  getAdminDocumentRows,
  parseDocumentFilters,
  type QueryParams,
} from "@/lib/hr/admin-data";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const filters = parseDocumentFilters(await searchParams);
  const documents = await getAdminDocumentRows(filters);

  return (
    <>
      <PageHeader eyebrow="Admin Documents" title="Documents" />

      <div className="mt-6 grid gap-5">
        <Panel icon="documents" title="Filters">
          <form className="mt-5" method="get">
            <FilterGrid>
              <FilterField label="Status">
                <SelectInput defaultValue={filters.status} name="status">
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </SelectInput>
              </FilterField>
              <FilterField label="Employee">
                <TextInput defaultValue={filters.employee} name="employee" placeholder="Name or email" />
              </FilterField>
              <FilterField label="Document Type">
                <SelectInput defaultValue={filters.kind} name="kind">
                  <option value="">All document types</option>
                  <option value="invoice">Invoice</option>
                  <option value="official">Official document</option>
                  <option value="private">Private document</option>
                  <option value="contract">Contract</option>
                </SelectInput>
              </FilterField>
              <FilterField label="From">
                <TextInput defaultValue={filters.from} name="from" type="date" />
              </FilterField>
              <FilterField label="To">
                <TextInput defaultValue={filters.to} name="to" type="date" />
              </FilterField>
            </FilterGrid>
            <div className="mt-4">
              <PrimaryButton>Apply Filters</PrimaryButton>
            </div>
          </form>
        </Panel>

        <Panel icon="documents" title="Document Register">
          <div className="mt-5 overflow-x-auto">
            {documents.length > 0 ? (
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-3 pr-4 font-semibold">Document</th>
                    <th className="py-3 pr-4 font-semibold">Employee</th>
                    <th className="py-3 pr-4 font-semibold">Type</th>
                    <th className="py-3 pr-4 font-semibold">Period</th>
                    <th className="py-3 pr-4 font-semibold">Issued</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr className="border-b border-zinc-100 last:border-0" key={document.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{document.title}</p>
                        {document.amountLabel ? (
                          <p className="text-xs text-zinc-500">{document.amountLabel}</p>
                        ) : null}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{document.employeeName}</p>
                        <p className="text-xs text-zinc-500">{document.employeeEmail}</p>
                      </td>
                      <td className="py-4 pr-4 text-zinc-600">{documentKindLabels[document.kind]}</td>
                      <td className="py-4 pr-4 text-zinc-600">{document.period}</td>
                      <td className="py-4 pr-4 text-zinc-600">{formatDate(document.issuedAt)}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge
                          label={documentStatusLabels[document.status]}
                          value={document.status}
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <a
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                          href={`/api/documents/${document.id}/download`}
                        >
                          <Icon name="download" />
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState>No documents match the selected filters.</EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
