import { decideLeaveRequestAction } from "@/app/actions/hr";
import {
  EmptyState,
  FilterField,
  FilterGrid,
  formatDate,
  PageHeader,
  Panel,
  PrimaryButton,
  requestStatusLabels,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../_components";
import {
  getAdminRequestRows,
  parseRequestFilters,
  type QueryParams,
} from "@/lib/hr/admin-data";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const filters = parseRequestFilters(await searchParams);
  const requests = await getAdminRequestRows(filters);
  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <>
      <PageHeader eyebrow="Admin Requests" title="Leave and Approval Queue">
        <span className="inline-flex h-10 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-700">
          {pendingCount} pending
        </span>
      </PageHeader>

      <div className="mt-6 grid gap-5">
        <Panel icon="requests" title="Filters">
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
              <FilterField label="Approver">
                <TextInput defaultValue={filters.reviewer} name="reviewer" placeholder="Reviewer name" />
              </FilterField>
              <FilterField label="From">
                <TextInput defaultValue={filters.from} name="from" type="date" />
              </FilterField>
              <FilterField label="To">
                <TextInput defaultValue={filters.to} name="to" type="date" />
              </FilterField>
            </FilterGrid>
            <div className="mt-4 flex flex-wrap gap-2">
              <PrimaryButton>Apply Filters</PrimaryButton>
              <a
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
                href="/admin/requests?status=pending"
              >
                Pending Requests
              </a>
            </div>
          </form>
        </Panel>

        <Panel icon="requests" title="Requests">
          <div className="mt-5 overflow-x-auto">
            {requests.length > 0 ? (
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-3 pr-4 font-semibold">Requested By</th>
                    <th className="py-3 pr-4 font-semibold">Balance</th>
                    <th className="py-3 pr-4 font-semibold">Request</th>
                    <th className="py-3 pr-4 font-semibold">Leave Dates</th>
                    <th className="py-3 pr-4 font-semibold">Approver</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr className="border-b border-zinc-100 last:border-0" key={request.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{request.employeeName}</p>
                        <p className="text-xs text-zinc-500">{request.employeeTitle}</p>
                        <p className="mt-1 text-xs text-zinc-500">{request.employeeEmail}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{request.balanceLabel}</p>
                        <p className="text-xs text-zinc-500">Holiday balance</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{request.kind}</p>
                        <p className="text-xs text-zinc-500">
                          Requested {formatDate(request.requestedAt)}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-zinc-600">
                        <p>
                          {formatDate(request.from)} - {formatDate(request.to)}
                        </p>
                        <p className="text-xs text-zinc-500">{request.days} business days</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-zinc-950">{request.reviewerName}</p>
                        <p className="text-xs text-zinc-500">{request.reviewerDetail}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge
                          label={requestStatusLabels[request.status]}
                          value={request.status}
                        />
                      </td>
                      <td className="py-4 pr-4">
                        {request.canDecide ? (
                          <div className="flex gap-2">
                            <form action={decideLeaveRequestAction}>
                              <input name="requestId" type="hidden" value={request.id} />
                              <input name="decision" type="hidden" value="approved" />
                              <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                                Approve
                              </button>
                            </form>
                            <form action={decideLeaveRequestAction}>
                              <input name="requestId" type="hidden" value={request.id} />
                              <input name="decision" type="hidden" value="rejected" />
                              <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-zinc-500">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState>No requests match the selected filters.</EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
