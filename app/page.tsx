import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import {
  createLeaveRequestAction,
  decideLeaveRequestAction,
  generateInvoicesAction,
  updatePersonalInfoAction,
} from "@/app/actions/hr";
import { getDashboardViewModel } from "@/lib/hr/dashboard";
import { requireCurrentViewer } from "@/lib/hr/session";
import type { DashboardViewModel, DocumentKind, LeaveKind, LeaveStatus } from "@/lib/hr/types";

const navItems = ["Dashboard", "Requests", "Calendar", "Documents", "Invoices", "People", "Admin"];

const metricToneClasses: Record<DashboardViewModel["metrics"][number]["tone"], string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  rose: "border-rose-200 bg-rose-50 text-rose-950",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-950",
};

const statusClasses: Record<LeaveStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const kindLabels: Record<LeaveKind, string> = {
  holiday: "Holiday",
  sick: "Sick",
  unpaid: "Unpaid",
};

const documentLabels: Record<DocumentKind, string> = {
  contract: "Contract",
  invoice: "Invoice",
  official: "Official",
  private: "Private",
};

export default async function Home() {
  const viewer = await requireCurrentViewer();
  const model = await getDashboardViewModel(viewer);

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-zinc-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-zinc-200 bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
              HR
            </div>
            <div>
              <p className="text-sm font-semibold">Private HR Portal</p>
              <p className="text-xs text-zinc-500">Internal workspace</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-1">
            {navItems.map((item, index) => (
              <a
                className={cx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  index === 0
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                )}
                href={getNavHref(item, model.activeRoleSlug)}
                key={item}
              >
                <Icon name={item.toLowerCase()} />
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-8 border-t border-zinc-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Signed In
            </p>
            <div className="mt-3 rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-950">{model.viewer.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{model.viewer.email}</p>
              <p className="mt-3 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold capitalize text-zinc-700">
                {model.activeRoleSlug.replaceAll("-", " ")}
              </p>
            </div>
            <form action={logoutAction} className="mt-3">
              <button className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">{model.viewer.department}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">
                {model.viewer.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">{model.viewer.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm">
                <Icon name="lock" />
                Access Checked
              </button>
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                href="#new-request"
              >
                <Icon name="plus" />
                New Leave Request
              </a>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {model.metrics.map((metric) => (
              <article
                className={cx("rounded-lg border p-4 shadow-sm", metricToneClasses[metric.tone])}
                key={metric.label}
              >
                <p className="text-sm font-medium opacity-75">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
                <p className="mt-1 text-sm opacity-75">{metric.detail}</p>
              </article>
            ))}
          </section>

          <section
            className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            id="personal-info"
          >
            <div className="flex flex-col gap-1 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-normal">Personal Info</h2>
             
              </div>
            </div>

            <form
              action={updatePersonalInfoAction}
              className="mt-5"
            >
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <ProfileFieldRow label="Name">
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                    defaultValue={model.viewer.name}
                    name="name"
                    required
                  />
                </ProfileFieldRow>
                <ProfileFieldRow label="Email">
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                    defaultValue={model.viewer.email}
                    name="email"
                    required
                    type="email"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow label="User Avatar">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <ProfileAvatar
                      name={model.viewer.name}
                      profilePhotoUrl={model.viewer.profilePhotoUrl}
                    />
                    <div className="flex-1">
                      <label className="block rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
                        <span className="text-sm font-medium text-zinc-700">
                          Browse files to upload
                        </span>
                        <input
                          accept="image/*"
                          className="mt-3 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                          name="profilePhoto"
                          type="file"
                        />
                      </label>
                      <p className="mt-2 text-xs text-zinc-500">
                        PNG, JPG, GIF, or WebP up to 2 MB.
                      </p>
                    </div>
                    {model.viewer.profilePhotoUrl ? (
                      <button
                        className="inline-flex size-11 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950"
                        formNoValidate
                        name="removeAvatar"
                        title="Remove avatar"
                        type="submit"
                        value="true"
                      >
                        <Icon name="trash" />
                      </button>
                    ) : null}
                  </div>
                </ProfileFieldRow>
                <ProfileFieldRow label="Job Title">
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                    defaultValue={model.viewer.title}
                    name="title"
                    required
                  />
                </ProfileFieldRow>
              </div>

              <div className="mt-4 flex justify-end">
                <button className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">
                  Save Personal Info
                </button>
              </div>
            </form>
          </section>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" id="requests">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">Leave Requests</h2>
                  <p className="text-sm text-zinc-500">Visible queue for the active role</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                  <Icon name="slack" />
                  Slack linked
                </span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="py-3 pr-4 font-semibold">Employee</th>
                      <th className="py-3 pr-4 font-semibold">Type</th>
                      <th className="py-3 pr-4 font-semibold">Dates</th>
                      <th className="py-3 pr-4 font-semibold">Days</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.leaveRequests.map((request) => (
                      <tr className="border-b border-zinc-100 last:border-0" key={request.id}>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-zinc-950">{request.employeeName}</p>
                          <p className="text-xs text-zinc-500">{request.employeeTitle}</p>
                        </td>
                        <td className="py-4 pr-4">{kindLabels[request.kind]}</td>
                        <td className="py-4 pr-4 text-zinc-600">
                          {formatDate(request.from)} - {formatDate(request.to)}
                        </td>
                        <td className="py-4 pr-4 font-medium">{request.days}</td>
                        <td className="py-4 pr-4">
                          <span
                            className={cx(
                              "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize",
                              statusClasses[request.status],
                            )}
                          >
                            {request.status}
                          </span>
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
                            <span className="text-xs font-medium text-zinc-500">
                              {request.reviewerName ?? "No action"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" id="new-request">
              <h2 className="text-lg font-semibold tracking-normal">Balance</h2>
              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-semibold tracking-normal">
                      {model.balances.holidayRemaining}
                    </p>
                    <p className="text-sm text-zinc-500">Holiday days left</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-600">
                    of {model.balances.holidayAllowance}
                  </p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-lg bg-zinc-100">
                  <div
                    className="h-full rounded-lg bg-emerald-600"
                    style={{
                      width: `${Math.round(
                        (model.balances.holidayRemaining / model.balances.holidayAllowance) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <BalanceRow label="Sick days used" value={model.balances.sickDaysUsed} />
                <BalanceRow label="Unpaid leave used" value={model.balances.unpaidLeaveUsed} />
              </div>

              <form action={createLeaveRequestAction} className="mt-6 grid gap-3">
                <input name="employeeId" type="hidden" value={model.viewer.id} />
                <label className="grid gap-1 text-sm font-medium text-zinc-700">
                  Type
                  <select
                    className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                    name="kind"
                  >
                    <option value="holiday">Holiday</option>
                    <option value="sick">Sick</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-medium text-zinc-700">
                    From
                    <input
                      className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950"
                      name="from"
                      required
                      type="date"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-zinc-700">
                    To
                    <input
                      className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950"
                      name="to"
                      required
                      type="date"
                    />
                  </label>
                </div>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white">
                  <Icon name="plus" />
                  Submit Request
                </button>
              </form>
            </section>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            <section
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2"
              id="calendar"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-normal">Team Calendar</h2>
                <Icon name="calendar" />
              </div>
              <div className="mt-5 grid gap-3">
                {model.teamCalendar.map((event) => (
                  <article
                    className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto]"
                    key={event.id}
                  >
                    <div>
                      <p className="font-semibold">{event.employeeName}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {kindLabels[event.kind]} leave, {formatDate(event.from)} -{" "}
                        {formatDate(event.to)}
                      </p>
                    </div>
                    <span
                      className={cx(
                        "inline-flex h-fit w-fit rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize",
                        statusClasses[event.status],
                      )}
                    >
                      {event.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" id="documents">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-normal">Documents</h2>
                <Icon name="documents" />
              </div>
              <div className="mt-5 grid gap-3">
                {model.documents.length > 0 ? (
                  model.documents.map((document) => (
                    <article className="rounded-lg border border-zinc-200 p-4" key={document.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {documentLabels[document.kind]}: {document.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{document.period}</p>
                        </div>
                        <a
                          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700"
                          href={`/api/documents/${document.id}/download`}
                        >
                          Download
                        </a>
                      </div>
                      {document.amountLabel ? (
                        <p className="mt-3 text-sm font-semibold text-zinc-950">
                          {document.amountLabel}
                        </p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500">
                    No documents visible for this role.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" id="people">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-normal">People</h2>
                <Icon name="people" />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {model.directory.map((employee) => (
                  <article className="rounded-lg border border-zinc-200 p-4" key={employee.id}>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{employee.title}</p>
                    <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                      <p>{employee.email}</p>
                      <p>{employee.location}</p>
                      <p>{employee.managerName ?? "No manager"}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" id="admin">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-normal">Financial Controls</h2>
                <Icon name="shield" />
              </div>
              <form action={generateInvoicesAction} className="mt-5 grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-zinc-700">
                  Period
                  <input
                    className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950"
                    defaultValue="April 2026"
                    name="period"
                  />
                </label>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white">
                  <Icon name="documents" />
                  Generate Invoices
                </button>
              </form>
              <div className="mt-5 grid gap-3">
                {model.adminFinancials.map((record) => (
                  <article className="rounded-lg border border-zinc-200 p-4" key={record.employeeName}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{record.employeeName}</p>
                        <p className="mt-1 text-sm text-zinc-500">{record.contractType}</p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-950">{record.monthlyRateLabel}</p>
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {record.invoiceCycle}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-5 border-t border-zinc-200 pt-5">
                <p className="text-sm font-semibold">Audit Trail</p>
                <div className="mt-3 grid gap-2">
                  {model.auditEvents.length > 0 ? (
                    model.auditEvents.map((event) => (
                      <div
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600"
                        key={event.id}
                      >
                        <p className="font-semibold text-zinc-900">{event.action}</p>
                        <p>
                          {event.actorName} - {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                      No audit events yet.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function BalanceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function ProfileFieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-zinc-200 px-4 py-4 last:border-b-0 md:grid-cols-[180px_1fr] md:items-start">
      <p className="pt-2 text-sm font-medium text-zinc-600">{label}</p>
      {children}
    </div>
  );
}

function ProfileAvatar({
  name,
  profilePhotoUrl,
}: {
  name: string;
  profilePhotoUrl: string | null;
}) {
  if (profilePhotoUrl) {
    return (
      <img
        alt={`${name} avatar`}
        className="size-20 rounded-lg border border-zinc-200 object-cover"
        src={profilePhotoUrl}
      />
    );
  }

  return (
    <div className="flex size-20 items-center justify-center rounded-lg bg-zinc-950 text-lg font-semibold text-white">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const common = {
    className: "size-4 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (name === "requests" || name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M8 3v4M16 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "documents" || name === "invoices") {
    return (
      <svg {...common}>
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M8 13h8M8 17h5" />
      </svg>
    );
  }

  if (name === "people") {
    return (
      <svg {...common}>
        <path d="M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19a3 3 0 0 0-4-2.8M4 19a3 3 0 0 1 4-2.8" />
      </svg>
    );
  }

  if (name === "admin" || name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.6-4" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common}>
        <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16M9 7V5h6v2M8 7v12m8-12v12M6 7l1 13a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7" />
      </svg>
    );
  }

  if (name === "slack") {
    return (
      <svg {...common}>
        <path d="M8 5v6M16 13v6M5 16h6M13 8h6" />
        <path d="M8 19a3 3 0 0 1 0-6h3v3a3 3 0 0 1-3 3ZM16 5a3 3 0 0 1 0 6h-3V8a3 3 0 0 1 3-3ZM5 8a3 3 0 0 1 6 0v3H8a3 3 0 0 1-3-3ZM19 16a3 3 0 0 1-6 0v-3h3a3 3 0 0 1 3 3Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNavHref(item: string, role: DashboardViewModel["activeRoleSlug"]): string {
  if (item === "Dashboard") {
    return "/";
  }

  if (role === "admin") {
    const adminRoutes: Record<string, string> = {
      Requests: "/admin/requests",
      Calendar: "/admin/calendar",
      Documents: "/admin/documents",
      Invoices: "/admin/invoices",
      Admin: "/admin",
    };

    return adminRoutes[item] ?? `#${item.toLowerCase()}`;
  }

  return `#${item.toLowerCase()}`;
}

function cx(...classes: Array<string | false>): string {
  return classes.filter(Boolean).join(" ");
}
