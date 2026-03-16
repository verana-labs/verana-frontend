'use client'

import { createVeranaAminoTypes, createVeranaRegistry } from '@verana-labs/verana-types';

export const veranaRegistry = createVeranaRegistry();
export const veranaAmino = createVeranaAminoTypes();

export const veranaGasPrice = '3uvna';
export const veranaGasLimit = 300000; 
export const veranaDenom = 'uvna';
export const veranaGasAdjustment = 2;
