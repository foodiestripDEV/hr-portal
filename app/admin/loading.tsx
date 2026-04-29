export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[270px_1fr]">
        <aside className="border-b border-zinc-200 bg-white px-5 py-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
              HR
            </div>
            <div>
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        </aside>
        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 grid gap-5">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
                <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
                <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-56 animate-pulse rounded bg-zinc-200" />
              <div className="mt-5 h-[420px] animate-pulse rounded-lg bg-zinc-100" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
