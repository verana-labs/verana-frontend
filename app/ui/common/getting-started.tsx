import { translate } from "@/i18n/dataview";
import { quickLinks, stepsGettingStarted } from "@/lib/dashlinks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { resolveTranslatable } from "../dataview/types";

export default function GettingStarted (){
    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: "gettingstarted.title"}, translate)}</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {stepsGettingStarted.map((step, idx) => {
                                return (
                                    <div key={`step-${idx}`}className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{step.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/10 dark:to-primary-900/20 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{quickLinks.title}</h4>
                                <div className="flex flex-col gap-2">
                                {quickLinks.links.map((link, idx) => {
                                    return (
                                        <Link key={`quickLink-${idx}`} href={link.href} target="_blank" >
                                            <span className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer">
                                                <FontAwesomeIcon icon={link.icon??'0' } className="mr-2"/>
                                                {link.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}