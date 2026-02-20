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

export type SellerRecentCouponEventsParams = {
  limit?: number
  offset?: number
}

export function useSellerRecentCouponEvents(params: SellerRecentCouponEventsParams) {
  const limit = params.limit ?? 10
  const offset = params.offset ?? 0

  const qs = buildQuery({ limit, offset })

  return useQuery<RecentCouponEventOut[]>({
    queryKey: ["seller", "coupons", "events", "recent", { limit, offset }],
    queryFn: () => apiFetch(`/sellers/coupons/events/recent${qs}`),

    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
}