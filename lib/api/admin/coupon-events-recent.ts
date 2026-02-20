import { useQuery, keepPreviousData } from "@tanstack/react-query"
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

export type RecentCouponEventOut = {
  id: number
  coupon_code: string
  actor_user_id: number | null
  event_type: string
  created_at: string
  status: string
}

export type AdminRecentCouponEventsParams = {
  limit?: number
  offset?: number
}

export function useAdminRecentCouponEvents(params: AdminRecentCouponEventsParams) {
  const limit = params.limit ?? 10
  const offset = params.offset ?? 0

  const qs = buildQuery({ limit, offset })

  return useQuery<RecentCouponEventOut[]>({
    queryKey: ["admin", "coupons", "events", "recent", { limit, offset }],
    queryFn: () => apiFetch(`/admin/coupons/events/recent${qs}`),

    // ✅ React Query v5 replacement for keepPreviousData
    placeholderData: keepPreviousData,

    // ✅ refresh recent feed
    refetchInterval: 10_000,
  })
}
