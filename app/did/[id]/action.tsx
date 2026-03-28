'use client';

import { MsgTypeDID } from '@/msg/constants/notificationMsgForMsgType';

// Define DidActionPage props interface
interface DidActionProps {
  action: MsgTypeDID;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: () => void; // Refresh DID data
  onBack?: () => void; // Close modal
}

export default function DidActionPage({ action, onClose }: DidActionProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
      The DID action `{action}` is temporarily unavailable on Verana `v0.10.x`.
      <div className="mt-4">
        <button className="btn-link" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
