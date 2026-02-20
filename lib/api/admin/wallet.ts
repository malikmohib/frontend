import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

function getLocalUsername(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("username")
}

function getLocalUserId(): number | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user_id")
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function useAdminWalletBalance() {
  const userId = getLocalUserId()

  return useQuery({
    queryKey: ["admin-wallet-balance", userId],
    queryFn: () => apiFetch(`/admin/wallet/balance/${userId}`),
    enabled: typeof userId === "number" && userId > 0,
  })
}

export function useAdminWalletHistory(params: {
  username: string
  date_from?: string
  date_to?: string
  entry_kind?: string
  tx_id?: string
  limit?: number
  offset?: number
}) {
  const qs = new URLSearchParams()
  qs.set("username", params.username)
  if (params.date_from) qs.set("date_from", params.date_from)
  if (params.date_to) qs.set("date_to", params.date_to)
  if (params.entry_kind) qs.set("entry_kind", params.entry_kind)
  if (params.tx_id) qs.set("tx_id", params.tx_id)
  qs.set("limit", String(params.limit ?? 50))
  qs.set("offset", String(params.offset ?? 0))

  return useQuery({
    queryKey: ["admin-wallet-history", params],
    queryFn: () => apiFetch(`/admin/wallet/history?${qs.toString()}`),
    enabled: !!params.username,
  })
}

export function useAdminWalletTxDetails(txId: string) {
  return useQuery({
    queryKey: ["admin-wallet-tx", txId],
    queryFn: () => apiFetch(`/admin/wallet/tx?tx_id=${encodeURIComponent(txId)}`),
    enabled: !!txId,
  })
}

export function useAdminWalletTopup() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: { user_id: number; amount_cents: number; note?: string | null }) =>
      apiFetch("/admin/wallet/topup", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallet-balance"] })
      qc.invalidateQueries({ queryKey: ["admin-wallet-history"] })
    },
  })
}

export function getDefaultAdminHistoryUsername(): string | null {
  return getLocalUsername()
}
