'use client'

import { useChain } from '@cosmos-kit/react'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_DID } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useNotification } from '@/providers/notification-provider'
import { DataTable } from '@/ui/common/data-table'
import { ModalAction } from '@/ui/common/modal-action'
import TitleAndButton from '@/ui/common/title-and-button'
import { columnsDidList, DidList, description, didFilter } from '@/ui/datatable/columnslist/did'
import { translateDataTableDescriptions } from '@/ui/datatable/types'
import { resolveTranslatable } from '@/ui/dataview/types'
import { getStatus } from '@/util/util'
import AddDidPage from './add/add'

export default function DidPage() {
  const [dids, setDids] = useState<DidList[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { notify } = useNotification()
  const listUrl = VERANA_REST_ENDPOINT_DID
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [addEntity, setAddEntity] = useState<boolean>(false)

  // Refresh listDids
  const [refresh, setRefresh] = useState<boolean>(true)

  useEffect(() => {
    if (!refresh) return
    const fetchDIDs = async () => {
      try {
        if (!listUrl) {
          notify(
            resolveTranslatable({ key: 'error.endpoint' }, translate) ?? 'API endpoint not configured',
            'error',
            resolveTranslatable({ key: 'error.fetch.did.title' }, translate) ?? 'Error fetching DID'
          )
        }
        const res = await fetch(listUrl + `/list?account=${address}`)
        const json = await res.json()
        let listDids = Array.isArray(json) ? json : json.dids || []
        // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
        listDids = listDids.map((did: any) => ({
          ...did,
          status: getStatus(did.exp),
        }))
        setDids(listDids)
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          resolveTranslatable({ key: 'error.fetch.did.title' }, translate) ?? 'Error fetching DID'
        )
      } finally {
        setLoading(false)
        setRefresh(false)
      }
    }
    fetchDIDs()
  }, [listUrl, address, refresh])

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({ key: 'directory.title' }, translate) ?? 'DID Directory'}
        description={translateDataTableDescriptions(description)}
        buttonLabel={resolveTranslatable({ key: 'button.did.add' }, translate) ?? 'Add DID'}
        onClick={() => setAddEntity(true)}
        icon={faPlus}
      />
      <DataTable
        entities={resolveTranslatable({ key: 'datatable.did.entities' }, translate) ?? ''}
        columnsI18n={columnsDidList}
        data={dids}
        initialPageSize={10}
        onRowClick={(row) => router.push(`/did/${encodeURIComponent(row.did)}`)}
        defaultSortColumn={'modified'}
        filterI18n={didFilter}
        showDetailModal={true}
        detailTitle={resolveTranslatable({ key: 'datatable.did.detail' }, translate)}
        onRefresh={() => setRefresh(true)}
        loading={loading}
      />
      {/* render modal */}
      {addEntity && (
        <ModalAction onClose={() => setAddEntity(false)} titleKey={'datatable.did.add'} isActive={addEntity}>
          <AddDidPage
            onCancel={() => {
              setAddEntity(false)
            }}
            onRefresh={() => {
              setRefresh(true)
              setTimeout(() => setAddEntity(false), 1000)
            }}
          />
        </ModalAction>
      )}
    </>
  )
}
