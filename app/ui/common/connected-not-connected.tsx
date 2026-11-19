'use client'

import { LinkIcon, UnlinkIcon } from 'lucide-react'
import Image from 'next/image'
import { translate } from '@/i18n/dataview'
import { EmptyState } from '@/ui/common/empty-state'
import Wallet from '@/wallet/wallet'
import { resolveTranslatable } from '../dataview/types'

interface WalletInfo {
  logo?:
    | string
    | {
        major: string
        minor: string
      }
  prettyName?: string
}

interface ConnectedProps {
  isConnected: boolean
  wallet?: WalletInfo
}

export default function Connected({ isConnected, wallet }: ConnectedProps) {
  return (
    <EmptyState
      className="bg-card py-12 ring-1 ring-foreground/10"
      outline={false}
      icon={isConnected ? <LinkIcon /> : <UnlinkIcon />}
      title={resolveTranslatable({ key: isConnected ? 'connected.title' : 'notconnected.title' }, translate)}
      description={resolveTranslatable({ key: isConnected ? 'connected.msg' : 'notconnected.msg' }, translate)}
      action={
        isConnected ? (
          <Image
            src={wallet?.logo ? wallet.logo.toString() : ''}
            alt={wallet?.prettyName ? wallet.prettyName : ''}
            width={56}
            height={56}
            className="size-14"
          />
        ) : (
          <Wallet />
        )
      }
    />
  )
}
