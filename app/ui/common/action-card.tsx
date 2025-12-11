import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export interface ActionCardProps {
  available: boolean;
  icon: IconDefinition;
  iconClass: string;
  title: string;
  description?: string;
  indicatorName?: string;
  indicatorValue?: string;
  valueVNA?: string;
  classValue?: string;
  valueUSD?: string;
}

export default function ActionCard ({ available, icon, iconClass, title, description, indicatorName, indicatorValue, valueVNA, classValue, valueUSD }: ActionCardProps) {
    return (
        (
        <div className="text-center py-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${iconClass}`}>
                <FontAwesomeIcon icon={icon} className={iconClass}/>
            </div>
            <h4 className={`text-lg font-medium mb-2 text-gray-900 dark:text-white`}>{title}</h4>
            {description && (
            <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4 max-w-md mx-auto">
                {description}
            </p>
            )}
            {available && (
            <div className="mb-6">
                <div className={`text-3xl font-bold font-mono mb-2 ${classValue}`}>{valueVNA}</div>
                <div className="text-sm text-neutral-70 dark:text-neutral-70">{valueUSD}</div>
            </div>
            )}
            {indicatorName && indicatorValue && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300">{indicatorName}</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">{indicatorValue}</span>
                </div>
            </div>
            )
            }
        </div>
        )
    );
}