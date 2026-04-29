import Link from "next/link";
import {
  EmptyState,
  FilterField,
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
  getOne,
  parseRequestFilters,
  type QueryParams,
} from "@/lib/hr/admin-data";
import { listPublicHolidaysForMonth } from "@/lib/hr/holidays";
import type { LeaveStatus } from "@/lib/hr/types";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const params = await searchParams;
  const month = normalizeMonth(getOne(params.month));
  const status = getOne(params.status);
  const filters = parseRequestFilters({
    status,
    from: `${month}-01`,
    to: getLastDayOfMonth(month),
    employee: params.employee,
    reviewer: "",
  });
  const requests = await getAdminRequestRows(filters);
  const holidays = listPublicHolidaysForMonth(month);
  const cells = getCalendarCells(month);

  return (
    <>
      <PageHeader eyebrow="Admin Calendar" title={formatMonth(month)}>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
          href={`/admin/calendar?month=${shiftMonth(month, -1)}${status ? `&status=${status}` : ""}`}
        >
          Previous
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
          href={`/admin/calendar?month=${shiftMonth(month, 1)}${status ? `&status=${status}` : ""}`}
        >
          Next
        </Link>
      </PageHeader>

      <div className="mt-6 grid gap-5">
        <Panel icon="calendar" title="Calendar Filters">
          <form className="mt-5 grid gap-3 md:grid-cols-[180px_220px_1fr_auto]" method="get">
            <FilterField label="Month">
              <TextInput defaultValue={month} name="month" type="month" />
            </FilterField>
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
            <div className="flex items-end">
              <PrimaryButton>Apply</PrimaryButton>
            </div>
          </form>
        </Panel>

        <Panel icon="calendar" title="Leave Calendar">
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[980px] rounded-lg border border-zinc-200">
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                {weekdays.map((day) => (
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500" key={day}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell) => {
                  const dayRequests = requests.filter(
                    (request) => request.from <= cell.date && request.to >= cell.date,
                  );
                  const dayHolidays = holidays.filter((holiday) => holiday.date === cell.date);

                  return (
                    <div
                      className={`min-h-[150px] border-b border-r border-zinc-100 p-3 last:border-r-0 ${cell.inMonth ? "bg-white" : "bg-zinc-50 text-zinc-400"}`}
                      key={cell.date}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{Number(cell.date.slice(-2))}</span>
                        {dayHolidays.length > 0 ? (
                          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            Holiday
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 grid gap-1">
                        {dayHolidays.map((holiday) => (
                          <div
                            className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-800"
                            key={`${holiday.country}-${holiday.name}`}
                          >
                            {holiday.country} {holiday.scope === "half-day" ? "Half-day" : holiday.scope}:{" "}
                            {holiday.name}
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 grid gap-1">
                        {dayRequests.map((request) => (
                          <div
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${eventClasses[request.status]}`}
                            key={`${cell.date}-${request.id}`}
                          >
                            <p className="truncate font-semibold">{request.employeeName}</p>
                            <p className="truncate">
                              {request.kind} - {requestStatusLabels[request.status]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Visible Requests">
          <div className="mt-5 grid gap-3">
            {requests.length > 0 ? (
              requests.map((request) => (
                <article
                  className="grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-[1fr_auto]"
                  key={request.id}
                >
                  <div>
                    <p className="font-semibold text-zinc-950">{request.employeeName}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {request.kind}, {formatDate(request.from)} - {formatDate(request.to)}
                    </p>
                  </div>
                  <StatusBadge label={requestStatusLabels[request.status]} value={request.status} />
                </article>
              ))
            ) : (
              <EmptyState>No leave requests match this calendar filter.</EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

const eventClasses: Record<LeaveStatus, string> = {
  approved: "border-emerald-100 bg-emerald-50 text-emerald-800",
  pending: "border-amber-100 bg-amber-50 text-amber-800",
  rejected: "border-rose-100 bg-rose-50 text-rose-800",
};

function normalizeMonth(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCalendarCells(month: string): Array<{ date: string; inMonth: boolean }> {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const cursor = new Date(first);
  cursor.setUTCDate(first.getUTCDate() - offset);

  return Array.from({ length: 42 }, () => {
    const date = toDateString(cursor);
    const inMonth = date.startsWith(`${month}-`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return { date, inMonth };
  });
}

function getLastDayOfMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return toDateString(new Date(Date.UTC(year, monthNumber, 0)));
}

function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
