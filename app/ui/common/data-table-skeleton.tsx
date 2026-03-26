interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export default function DataTableSkeleton({
  rows = 6,
  columns = 4,
  showHeader = true,
}: DataTableSkeletonProps) {
  const colWidth = (j: number) =>
    j === 0 ? "w-1/4" : j === 1 ? "w-1/3" : "w-1/5";

  const base = "bg-gray-200 dark:bg-gray-700 animate-pulse rounded";

  return (
    <div className="skeleton-card">
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton-title w-1/4" />
          <div className={`${base} h-10 w-28`} />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className={
                  j === columns - 1
                    ? `${base} h-6 w-16 rounded-full`
                    : `${base} h-4 ${colWidth(j)}`
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
