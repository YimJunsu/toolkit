export function ToolCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-4">
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-lg bg-border/50" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-3/4 rounded bg-border/40" />
        <div className="h-3 w-full rounded bg-border/30" />
        <div className="h-3 w-2/3 rounded bg-border/20" />
      </div>
    </div>
  );
}
