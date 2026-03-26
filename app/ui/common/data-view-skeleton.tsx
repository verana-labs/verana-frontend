import { Section } from "@/ui/dataview/types";

interface DataViewSkeletonProps<T> {
  sections: Section<T>[];
}

export default function DataViewSkeleton<T>({ sections }: DataViewSkeletonProps<T>) {
  return (
    <div className="space-y-6">
      {sections.map(({ type, cardView, sectionBorder, name, fields, largeTexts }, i) => {
        const isActions = type === "actions";

        return (
          <div
            key={i}
            className={`${!cardView && "skeleton-card"} ${sectionBorder && "border rounded-xl p-4"}`}
          >
            {name && <div className="skeleton-title mb-6 w-1/4" />}

            {isActions ? (
              <div className="flex flex-wrap gap-4">
                {fields?.map((_, j) => (
                  <div key={j} className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={cardView
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "grid grid-cols-1 md:grid-cols-2 gap-6"
              }>
                {fields?.map((_, j) => (
                  <div key={j} className={cardView ? "skeleton-card p-4" : "space-y-2"}>
                    <div className="skeleton-text-sm w-1/3 mb-2" />

                    <div
                      className={`${largeTexts ? "h-8 w-1/2" : "h-5 w-2/3"} rounded bg-gray-200 dark:bg-gray-700 animate-pulse`}
                    />

                    {!cardView && !largeTexts && (
                      <div className="skeleton-text-sm w-1/2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
