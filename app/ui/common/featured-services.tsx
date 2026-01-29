import { translate } from '@/i18n/dataview';
import { links } from '@/lib/navlinks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { resolveTranslatable } from '../dataview/types';
import Link from 'next/link';

type FeaturedServicesProps = {
  isWalletConnected: boolean;
};

export default function FeaturedServices({ isWalletConnected }: FeaturedServicesProps) {

    return (
        <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{resolveTranslatable({key: 'featuredservices.title'}, translate)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links
                    .filter((link) => link.featuredService === true)
                    .map((link, idx: number) => (
                    <div key={`FeaturedServices-${idx}`} className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex items-center mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${link.iconClass}`}>
                                    <FontAwesomeIcon icon={link.icon} className={link.iconClass}/>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{link.name}</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{link.description}</p>
                            <div className="flex items-center justify-between mt-auto pt-4">
                                { (isWalletConnected || link.availableOffline) ? (
                                <span className="text-sm text-success-600 dark:text-success-400">{resolveTranslatable({key: 'featuredservices.available'}, translate)}</span>
                                ) : (
                                <span className="text-sm text-neutral-70 dark:text-neutral-70">{resolveTranslatable({key: 'featuredservices.connectrequired'}, translate)}</span>
                                )}
                                <Link
                                    className={`text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm opacity-50 ${(isWalletConnected || link.availableOffline)? '' : 'cursor-not-allowed'}`}
                                    href={(isWalletConnected || link.availableOffline)? link.href : ''}
                                >
                                    {resolveTranslatable({key: "featuredservices.explore"}, translate)}
                                </Link>
                            </div>
                        </div>
                    </div>
                    ))
                }
            </div>
        </section>
    );
}