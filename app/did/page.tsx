'use client';

import TitleAndButton from '@/ui/common/title-and-button';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

export default function DidPage() {
  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "directory.title"}, translate)?? "DID Directory"}
        description={[resolveTranslatable({ key: "meta.did.list.description" }, translate) ?? "Legacy DID management is temporarily unavailable on Verana v0.10.x."]}
        buttonLabel={resolveTranslatable({ key: "button.did.back" }, translate) ?? "Back"}
        to="/dashboard"
        icon={faChevronLeft}
      />
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        DID listing and DID write actions are temporarily disabled on this branch while the frontend is being migrated to the Verana `v0.10.x` backend surface.
      </div>
    </>
  );
}
