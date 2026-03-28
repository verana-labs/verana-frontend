'use client'

type AddDidPageProps = {
  onCancel: () => void;
  onRefresh: () => void;
}

export default function AddDidPage({ onCancel }: AddDidPageProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
      DID creation is temporarily unavailable on Verana `v0.10.x`.
      <div className="mt-4">
        <button className="btn-link" onClick={onCancel}>Close</button>
      </div>
    </div>
  );
}
