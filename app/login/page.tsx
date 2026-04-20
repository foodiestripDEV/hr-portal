import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getCurrentViewer } from "@/lib/hr/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

const demoAccounts = [
  "maya.demir@example.com",
  "alessandro.rossi@example.com",
  "sofia.marino@example.com",
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const viewer = await getCurrentViewer();

  if (viewer) {
    redirect("/");
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="grid min-h-screen bg-[#f6f7f3] px-4 py-8 text-zinc-950 lg:grid-cols-[1fr_480px]">
      <section className="hidden items-end border-r border-zinc-200 pr-10 lg:flex">
        <div className="max-w-2xl pb-10">
          <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
            HR
          </div>
          <h1 className="mt-8 text-5xl font-semibold tracking-normal">
            Private HR Portal
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600">
            Secure access for leave requests, private employee documents, manager approvals, and
            HR operations.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
              HR
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-normal">Sign in</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Use your internal HR portal credentials.
          </p>

          {error ? (
            <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <form action={loginAction} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Email
              <input
                autoComplete="email"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Password
              <input
                autoComplete="current-password"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                name="password"
                required
                type="password"
              />
            </label>
            <button className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">
              Sign in
            </button>
          </form>

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Development Accounts
              </p>
              <div className="mt-3 grid gap-1 text-sm text-zinc-600">
                {demoAccounts.map((email) => (
                  <p key={email}>{email}</p>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Password: {process.env.HR_DEMO_PASSWORD ?? "HrPortal2026!"}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
