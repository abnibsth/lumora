export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat data dashboard">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-[#e7efe9]" />
        <div className="h-4 w-96 max-w-full rounded bg-[#e7efe9]" />
      </div>

      {/* 4 KPI Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-[#e7efe9]" />
              <div className="size-9 rounded-xl bg-[#e7efe9]" />
            </div>
            <div className="mt-4 h-9 w-20 rounded bg-[#e7efe9]" />
            <div className="mt-2 h-3 w-36 rounded bg-[#e7efe9]" />
          </div>
        ))}
      </div>

      {/* Perlu Perhatian Skeleton */}
      <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs">
        <div className="h-5 w-44 rounded bg-[#e7efe9]" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#e7efe9]" />
      </div>

      {/* Middle row skeleton: Chart & Table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs lg:col-span-5">
          <div className="h-5 w-48 rounded bg-[#e7efe9]" />
          <div className="mt-2 h-4 w-64 rounded bg-[#e7efe9]" />
          <div className="mt-6 h-56 rounded-xl bg-[#e7efe9]" />
        </div>
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs lg:col-span-7">
          <div className="h-5 w-40 rounded bg-[#e7efe9]" />
          <div className="mt-2 h-4 w-56 rounded bg-[#e7efe9]" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-12 rounded-lg bg-[#e7efe9]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
