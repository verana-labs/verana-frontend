'use client'

import React from 'react'
import ActionDID from '@/app/msg/did-directory/actionDID'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import TitleAndButton from '@/app/ui/common/title-and-button'

export default function AddDidPage() {
  return (
    <>
      <TitleAndButton
        title="Add DID to Directory"
        buttonLabel="Back to Directory"
        to="/did"
        Icon={ChevronLeftIcon}
      />
      <div className="min-w-full p-8 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg">
        <ActionDID action={'MsgAddDID'} id={undefined} />
      </div>
    </>
  )
}
