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

export type AdminOrdersParams = {
  plan_id?: number | null
  buyer_user_id?: number | null
  status?: string | null
  date_from?: string | null
  date_to?: string | null
  limit?: number
  offset?: number
}

export function useAdminOrders(params: AdminOrdersParams) {
  const qs = buildQuery({
    plan_id: params.plan_id,
    buyer_user_id: params.buyer_user_id,
    status: params.status,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  })

  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => apiFetch(`/admin/orders${qs}`),
  })
}

export function useAdminOrderDetail(orderNo: number) {
  return useQuery({
    queryKey: ["admin-order-detail", orderNo],
    queryFn: () => apiFetch(`/admin/orders/${orderNo}`),
    enabled: Number.isFinite(orderNo) && orderNo > 0,
  })
}
