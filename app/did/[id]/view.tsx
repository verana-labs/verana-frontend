'use client'

import TitleAndButton from '@/ui/common/title-and-button';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

type DIDViewProps = {
  id?: string;
  selectDidData?: { did?: string };
  onBack?: () => void;
  showHeader?: boolean;
  onRefreshTable?: (id?: string, txHeight?: number) => void;
};

export default function DIDView({ id, selectDidData, onBack, showHeader = true}: DIDViewProps) {
  const did = id ?? selectDidData?.did ?? '';
  return (
    <> 
      {showHeader ? (
        <TitleAndButton
          title={`${resolveTranslatable({key: "did.title"}, translate)?? "DID"} ${did}`.trim()}
          buttonLabel={resolveTranslatable({key: "button.did.back"}, translate)?? "Back to Directory"}
          to="/did"
          icon={faChevronLeft}
        />
      ) : null}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Legacy DID detail and DID write actions are temporarily unavailable on Verana `v0.10.x`.
        {onBack ? (
          <div className="mt-4">
            <button className="btn-link" onClick={onBack}>Back</button>
          </div>
        ) : null}
      </div>
    </>
  );
}
