'use client'

import { type ComponentProps, useState } from 'react'
import { Input } from '@/ui/shadcn/input'

type NumberInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: unknown
  onValueChange: (value: number | '') => void
}

export function numberInputText(typed: string, value: unknown): string {
  return typed !== '' && Number(typed) === value ? typed : String(value ?? '')
}

export function NumberInput({ value, onValueChange, ...props }: NumberInputProps) {
  const [typed, setTyped] = useState('')

  return (
    <Input
      {...props}
      type="number"
      value={numberInputText(typed, value)}
      onChange={(e) => {
        const raw = e.target.value
        setTyped(raw)
        onValueChange(raw === '' ? '' : Number(raw))
      }}
    />
  )
}
