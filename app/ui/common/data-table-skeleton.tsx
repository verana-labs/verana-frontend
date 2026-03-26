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
  return (
    <div className="skeleton-card">
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton-title w-1/4" />
          <div className="h-10 w-28 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      )}

      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
          >
            {[...Array(columns)].map((_, j) => {
              if (j === columns - 1) {
                return (
                  <div
                    key={j}
                    className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                  />
                );
              }

              return (
                <div
                  key={j}
                  className={`
                    h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse
                    ${
                      j === 0
                        ? "w-1/4"
                        : j === 1
                        ? "w-1/3"
                        : "w-1/5"
                    }
                  `}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
