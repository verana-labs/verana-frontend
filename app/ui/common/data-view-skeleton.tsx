import { Section } from "@/ui/dataview/types";

interface DataViewSkeletonProps<T> {
  sections: Section<T>[];
}

export default function DataViewSkeleton<T>({
  sections,
}: DataViewSkeletonProps<T>) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        const isActions = section.type === "actions";

        return (
          <div
            key={i}
            className={`
              ${section.cardView ? "" : "skeleton-card"}
              ${section.sectionBorder ? "border rounded-xl p-4" : ""}
            `}
          >
            {/* Title */}
            {section.name && (
              <div className="skeleton-title mb-6 w-1/4" />
            )}

            {/* ACTIONS */}
            {isActions ? (
              <div className="flex flex-wrap gap-4">
                {section.fields?.map((_, j) => (
                  <div
                    key={j}
                    className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              /* DATA */
              <div
                className={`
                  ${
                    section.cardView
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "grid grid-cols-1 md:grid-cols-2 gap-6"
                  }
                `}
              >
                {section.fields?.map((field, j) => {
                  return (
                    <div
                      key={j}
                      className={`
                        ${
                          section.cardView
                            ? "skeleton-card p-4"
                            : "space-y-2"
                        }
                      `}
                    >
                      {/* LABEL */}
                      <div className="skeleton-text-sm w-1/3 mb-2" />

                      {/* VALUE */}
                      <div
                        className={`
                          ${
                            section.largeTexts
                              ? "h-8 w-1/2"
                              : "h-5 w-2/3"
                          }
                          rounded bg-gray-200 dark:bg-gray-700 animate-pulse
                        `}
                      />

                      {/* EXTRA (solo en no-cards) */}
                      {!section.cardView && !section.largeTexts && (
                        <div className="skeleton-text-sm w-1/2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
