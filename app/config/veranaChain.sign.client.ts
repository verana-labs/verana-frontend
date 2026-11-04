'use client'

import { createVeranaAminoTypes, createVeranaRegistry } from '@verana-labs/verana-types'
import { withGroupAminoConverters } from '@/msg/util/group-amino'

export const veranaRegistry = createVeranaRegistry()
export const veranaAmino = withGroupAminoConverters(createVeranaAminoTypes(), veranaRegistry)

export const veranaGasPrice = '3uvna'
export const veranaGasLimit = 300000
export const veranaDenom = 'uvna'
export const veranaGasAdjustment = 2
