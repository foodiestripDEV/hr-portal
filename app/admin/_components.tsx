import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type {
  DocumentKind,
  DocumentStatus,
  InvoiceStatus,
  LeaveStatus,
  Role,
  Viewer,
} from "@/lib/hr/types";

export const adminNavItems = [
  { label: "Users", href: "/admin", icon: "people" },
  { label: "Requests", href: "/admin/requests", icon: "requests" },
  { label: "Calendar", href: "/admin/calendar", icon: "calendar" },
  { label: "Documents", href: "/admin/documents", icon: "documents" },
  { label: "Invoices", href: "/admin/invoices", icon: "invoices" },
];

export const roleLabels: Record<Role, string> = {
  master_admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

export const requestStatusLabels: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
};

export const documentKindLabels: Record<DocumentKind, string> = {
  invoice: "Invoice",
  official: "Official document",
  private: "Private document",
  contract: "Contract",
};

export function AdminShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[270px_1fr]">
        <aside className="border-b border-zinc-200 bg-white px-5 py-5 xl:border-b-0 xl:border-r">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
              HR
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Workspace</p>
              <p className="text-xs text-zinc-500">Private HR Portal</p>
            </div>
          </Link>

          <nav className="mt-8 grid gap-1">
            {adminNavItems.map((item) => (
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                href={item.href}
                key={item.href}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-zinc-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Signed In</p>
            <div className="mt-3 rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-950">{viewer.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{viewer.email}</p>
              <p className="mt-3 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
                {roleLabels[viewer.role]}
              </p>
            </div>
            <form action={logoutAction} className="mt-3">
              <button className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">{children}</section>
      </div>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">{title}</h1>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        {icon ? <Icon name={icon} /> : null}
      </div>
      {children}
    </section>
  );
}

export function FilterGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{children}</div>;
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
    />
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">
      {children}
    </button>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
      href={href}
    >
      {children}
    </Link>
  );
}

export function StatusBadge({
  value,
  label,
}: {
  value: LeaveStatus | DocumentStatus | InvoiceStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[value]}`}
    >
      {label}
    </span>
  );
}

export function InitialsAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
      {children}
    </p>
  );
}

export function Icon({ name }: { name: string }) {
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

  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

const statusClasses: Record<LeaveStatus | DocumentStatus | InvoiceStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};
