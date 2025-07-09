'use client'

import React from 'react'
import ActionDID from '@/app/msg/diddiretory/ActionDID'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function AddDidPage() {
  const router = useRouter()
  return (
    <div
      className="
        min-h-screen
        max-w-screen-xl mx-auto
      "
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-title-light-color dark:text-title-dark-color">
          Add DID to Directory
        </h1>
        <button
          onClick={() => router.push('/dids')}
          className="flex items-center text-blue-500 hover:underline"
        >
          <ChevronLeftIcon aria-hidden="true" className="h-6 w-6 mr-1" />
          <span>Back to Directory</span>
        </button>
      </div>
      <div className="min-w-full p-8 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg">
        <ActionDID action={'AddDID'} id={undefined} />
      </div>
    </div>
  )
}
