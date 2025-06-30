'use client'

import React from 'react'
import ActionDID from '@/app/msg/diddiretory/ActionDID'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function AddDidPage() {
  const router = useRouter()
  return (
    <div className="min-w-full p-8 rounded-2xl shadow-lg">
      <div className="flex justify-end mb-6 p-6">
        <button
          onClick={() => router.push('/dids')}
          className="flex items-center text-blue-500 hover:underline"
        >
          <ChevronLeftIcon aria-hidden="true" className="h-6 w-6 mr-1" />
          <span>Back to Directory</span>
        </button>
      </div>
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Add DID to Directory</h1>
        <ActionDID action={'AddDID'} id={undefined} />
      </div>
    </div>
  )
}
