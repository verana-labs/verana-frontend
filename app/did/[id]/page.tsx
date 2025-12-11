'use client'

import { useParams, useRouter } from 'next/navigation';
import DIDView from './view';

export default function DIDViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Render the page: Title, button, and DataView for DID info
  return (
    <DIDView
      id={id}
      onBack={() => router.push('/did')}
    />
  );
}
