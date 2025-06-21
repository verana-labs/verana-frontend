'use client'

import DataView from '@/app/ui/dashboard/data-view'
import { Section } from "@/app/types/data-info";
 
export default function Page() {

    const info: Section[] = [];
    
    return (
      <DataView sections={info} title='DID Directory' />
    );
}