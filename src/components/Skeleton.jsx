/* Skeleton loader */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="h-3 w-20 rounded mb-3" style={{ background: "var(--border)" }} />
      <div className="h-7 w-28 rounded" style={{ background: "var(--border)" }} />
    </div>
  );
}


export function SkeletonChart() {
  return (
    <div className="rounded-2xl p-4 animate-pulse h-[240px]" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="h-3 w-32 rounded mb-4" style={{ background: "var(--border)" }} />
      <div className="h-full w-full rounded-xl" style={{ background: "var(--border)" }} />
    </div>
  );
}
