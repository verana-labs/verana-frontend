'use client';

import { LinkSlashIcon } from '@heroicons/react/24/outline';
import Wallet from "@/app/wallet/wallet";

export default function NotConnected () {
    return (
    <div className="min-w-full py-16 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg flex flex-col items-center gap-10">
        <div className="w-20 h-20 
            bg-gradient-to-b from-pink-100 to-pink-200
            dark:from-pink-500 dark:via-pink-900 dark:to-pink-950
            rounded-2xl flex justify-center items-center">
            <div className="w-14 h-14 rounded-full bg-white flex justify-center items-center">
                <LinkSlashIcon className="w-8 h-8 text-pink-500" />
            </div>
        </div>
        <div className="self-stretch flex flex-col justify-start text-center items-center gap-3.5">
            <div className="text-2xl md:text-3xl font-semibold ">Not Connected</div>
            <div className="w-80 md:w-[464px] text-base md:text-xl font-normal leading-norma md:leading-7">Please connect your preferred crypto wallet to verana before you proceed</div>
        </div>
        <div className="w-72 px-6 py-5 rounded-lg gap-2 justify-center items-center text-xl font-semibold leading-snug
                        text-light-selected-bg bg-light-selected-text
                        border-light-border dark:border-dark-border 
                        text-connect-light-text dark:text-connect-dark-text 
                        hover:text-light-selected-text hover:bg-light-selected-bg dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg"
        >
            <Wallet isNavBar={false}/>
        </div>
    </div>
    );
}
