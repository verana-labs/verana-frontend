import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";
import { getVNALinks } from "@/lib/getlinks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function GetVNATokens (){
    const [activeActionId, setActiveActionId] = useState<string | null>(null);
    
    return (
        <div id="get-vna-content" className="p-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{resolveTranslatable({key: "gettoken.title"}, translate)}</label>
                    <div className="space-y-3">
                        {
                        getVNALinks.map((item, idx) => {
                        const rowId = `service-${idx}`;
                        const isActive = activeActionId === rowId;
                        return (
                        <div key={rowId}  className="topup-service-item">
                            <label className="relative flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                onClick={() => setActiveActionId(isActive ? null : rowId)}
                            >
                                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 rounded-full mr-3 flex-shrink-0">
                                    <div className={`w-full h-full rounded-full bg-primary-600 transition-transform radio-dot ${isActive?"scale-100":"scale-0"}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-neutral-70 dark:text-neutral-70">{item.by}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                        {item.iconsPay.map((iconPay, idx) => (
                                            <FontAwesomeIcon
                                            key={idx}
                                            icon={iconPay.icon}
                                            className={iconPay.iconClass}
                                            />
                                        ))}
                                        </div>
                                    </div>
                                </div>
                            </label>
                            {isActive && (
                            <div className="ml-7 mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-neutral-20 dark:border-neutral-70" data-service="coinbase">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-64 h-64 bg-white p-2 rounded-lg border-2 border-neutral-20 dark:border-neutral-70">
                                            <img src={item.hrefQr} alt={item.name} className="w-full h-full"/>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{resolveTranslatable({key: "gettoken.instructions"}, translate)}</h4>
                                        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">{item.instructions}</p>
                                        <a href={item.href} target="_blank" className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                                            <FontAwesomeIcon icon={faUpRightFromSquare} className="mr-2" />
                                            {item.goTo}
                                        </a>
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                        )})
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}