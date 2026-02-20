import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    qs.set(k, String(v))
  })
  const str = qs.toString()
  return str ? `?${str}` : ""
}

export type AdminWalletHistoryParams = {
  // OPTIONAL:
  // - if omitted/empty => backend returns all sellers below current admin
  // - if provided => backend filters to that seller
  username?: string | null

  date_from?: string | null
  date_to?: string | null
  entry_kind?: string | null
  tx_id?: string | null
  limit?: number
  offset?: number
}

export type AdminWalletHistoryItem = {
  id: number
  created_at: string
  tx_id: string
  entry_kind: string
  amount_cents: number
  balance_after_cents: number
  currency: "USD" | string

  // NEW: so table can show the real user and note when listing ALL
  username?: string | null
  note?: string | null
}

export type AdminWalletHistoryResponse = {
  items: AdminWalletHistoryItem[]
  offset?: number
  limit?: number
}

export function useAdminBalanceHistory(params: AdminWalletHistoryParams) {
  const qs = buildQuery({
    username: params.username && params.username.trim().length > 0 ? params.username : null,
    date_from: params.date_from,
    date_to: params.date_to,
    entry_kind: params.entry_kind,
    tx_id: params.tx_id,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  })

  return useQuery<AdminWalletHistoryResponse>({
    queryKey: ["admin-wallet-ledger", params],
    queryFn: () => apiFetch(`/admin/wallet/ledger${qs}`),
    // ALWAYS enabled: default page load should show recent history
    enabled: true,
  })
}
