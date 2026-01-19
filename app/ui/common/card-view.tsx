'use client';

import React from 'react';
import { ResolvedDataField } from '../dataview/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { faCheckCircle, faCoins, faLock } from '@fortawesome/free-solid-svg-icons';
import { formatUSDfromUVNA } from '@/util/util';
import { useTrustDepositParams } from '@/providers/trust-deposit-params-context';


type CardViewProps<T> = {
  field: ResolvedDataField<T>;
  data: T;
  largeTexts?: boolean;
};

export default function CardView<T>({ field, data, largeTexts }: CardViewProps<T>) {
    const value = String(data[field.name]);
    const trustUnitPrice = useTrustDepositParams().trustUnitPrice;
    const conversionFactorUSDfromVNA = 1_000_000 / Number(trustUnitPrice);
    const valueUSD = field.usdValue ? formatUSDfromUVNA(value.split('VNA')[0], conversionFactorUSDfromVNA) : null;
    const iconWrapperClass = field.iconClass ?? '';
    const iconColorClass = field.iconColorClass ?? field.iconClass ?? '';
  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
        <div className="p-6">
            {
            (largeTexts) ? (
                <>
                <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            { field.icon && (
                        <div className= {clsx("w-12 h-12 rounded-xl flex items-center justify-center mr-4", iconWrapperClass)}>
                            <FontAwesomeIcon icon={field.icon} className={iconColorClass}/>
                        </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{field.label}</h3>
                                <p className="text-sm text-neutral-70 dark:text-neutral-70">{field.description}</p>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{value}</div>
                    <div className="text-sm text-neutral-70 dark:text-neutral-70 mt-1">{valueUSD??''}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    { field.name == "balance" &&
                    (
                    <span className="text-success-600 dark:text-success-400 flex items-center">
                        <FontAwesomeIcon icon={faCheckCircle}/>
                        Available
                    </span>
                    )
                    }
                    { field.name == "totalTrustDeposit" &&
                    (
                    <>
                    <span className="text-blue-600 dark:text-blue-400 flex items-center">
                        <FontAwesomeIcon icon={faLock}/>
                        Locked
                    </span>
                    { data['claimableInterests' as keyof T] &&
                    <span className="text-orange-600 dark:text-orange-400 flex items-center">
                        <FontAwesomeIcon icon={faCoins}/>
                        {String(data['claimableInterests' as keyof T])}
                    </span>
                    }
                    <span className="text-neutral-70 dark:text-neutral-70">APY: <strong>4.2%</strong></span>
                    </>
                    )
                    }
                    {/* <span className="text-neutral-70 dark:text-neutral-70">Last updated: 2 min ago</span> */}
                </div>
                </>
                )
            : (
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        { field.icon && (
                    <div className= {clsx("w-12 h-12 rounded-xl flex items-center justify-center", iconWrapperClass)}>
                        <FontAwesomeIcon icon={field.icon} className={iconColorClass}/>
                    </div>
                        )}
                    </div>
                <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-70 dark:text-neutral-70">{field.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{value}</p>
                    {/* <p className="text-sm text-success-600 dark:text-success-400">+1 new block</p> */}
                </div>
            </div>
            )
            }
        </div>
    </div>
  );
}
