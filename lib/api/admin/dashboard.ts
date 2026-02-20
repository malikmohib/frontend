import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"
import { endpoints } from "@/lib/api/endpoints"
import { useDashboardFilter } from "@/app/admin/dashboard/dashboard-filter"

function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    qs.set(k, String(v))
  })

  const str = qs.toString()
  return str ? `?${str}` : ""
}

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: () => apiFetch(endpoints.admin.dashboard.summary),
  })
}

export function useAdminBalances() {
  return useQuery({
    queryKey: ["admin-dashboard-balances"],
    queryFn: () => apiFetch(endpoints.admin.dashboard.balances),
  })
}

export function useAdminSalesByPlan() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["admin-dashboard-sales-by-plan", filter],
    queryFn: () => apiFetch(`${endpoints.admin.dashboard.salesByPlan}${qs}`),
  })
}

export function useAdminSalesBySeller() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["admin-dashboard-sales-by-seller", filter],
    queryFn: () => apiFetch(`${endpoints.admin.dashboard.salesBySeller}${qs}`),
  })
}

export function useAdminProfitBySeller() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["admin-dashboard-profit-by-seller", filter],
    queryFn: () => apiFetch(`${endpoints.admin.dashboard.profitBySeller}${qs}`),
  })
}
