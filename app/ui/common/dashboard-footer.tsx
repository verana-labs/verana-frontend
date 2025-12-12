import { communityLinks, configFooter, footLinks, veranaLinks } from "@/lib/dashlinks";
import { faCopyright } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default function DashboardFooter () {
    return (
    <footer className="border-t border-neutral-20 dark:border-neutral-70 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                      <img src={configFooter.img} alt="Veranito Logo" className="w-8 h-8"/>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{configFooter.title}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                      {configFooter.msg}
                  </p>
                  <div className="flex space-x-4">
                    {communityLinks.map((link, idx) => {
                        return (
                            <Link key={`communityLink-${idx}`} href={link.href} target="_blank">
                            <span className="text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer">
                                <FontAwesomeIcon icon={link.icon??'0'}/>
                                </span>
                            </Link>
                        );
                    })}
                  </div>
            </div>
            {footLinks.map((links, i) => {
                return (
                <div key={i}>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{links.title}</h4>
                    <ul className="space-y-2">
                        {links.links.map((link, j) => {
                            return (
                                <li key={`${i}-${j}`}>
                                    <Link href={link.href} target="_blank">
                                        <span className={link.className?? "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm cursor-pointer"}>
                                            {link.label}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                );
            })}
        </div>
        <div className="mt-8 pt-4 border-t border-neutral-20 dark:border-neutral-70 flex flex-col sm:flex-row justify-between items-center">
            
            <p className="text-sm text-neutral-70 dark:text-neutral-70"><FontAwesomeIcon icon={faCopyright}/>{configFooter.copyright}</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
            {veranaLinks.map((link, idx) => {
                return (
                <Link key={`veranaLink-${idx}`} href={link.href} target="_blank">
                    <span className="text-sm text-neutral-70 dark:text-neutral-70 hover:text-gray-900 dark:hover:text-white cursor-pointer">{link.label}</span>
                </Link>
                );
            })}
            </div>
        </div>
    </footer>
    );
}