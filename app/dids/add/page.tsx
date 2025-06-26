'use client'

import React from 'react'
import AddDID from '@/app/msg/diddiretory/AddDID'

export default function AddDidPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Add DID to Directory</h1>
        <AddDID />
      </div>
    </div>
  )
}
