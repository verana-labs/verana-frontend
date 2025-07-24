'use client'

import React from 'react'
import ActionDID from '@/app/msg/did-diretory/actionDID'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import TitleAndButton from '@/app/ui/common/title-and-button'

export default function AddTrPage() {
  return (
    <>
      <TitleAndButton
        title="Add Trust Registry"
        buttonLabel="Back to List"
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      <div className="min-w-full p-8 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg">
        <ActionDID action={'AddDID'} id={undefined} />
      </div>
    </>
  )
}
