"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"
import { endpoints } from "@/lib/api/endpoints"
import { useDashboardFilter } from "@/app/seller/dashboard/dashboard-filter"

function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams()

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    qs.set(k, String(v))
  })

  const str = qs.toString()
  return str ? `?${str}` : ""
}

export function useSellerDashboardSummaryRollup() {
  return useQuery({
    queryKey: ["seller-dashboard-summary-rollup"],
    queryFn: () => apiFetch(endpoints.seller.dashboard.summaryRollup),
  })
}

export function useSellerSalesByPlanRollup() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["seller-dashboard-sales-by-plan-rollup", filter],
    queryFn: () => apiFetch(`${endpoints.seller.dashboard.salesByPlanRollup}${qs}`),
  })
}

export function useSellerSalesBySellerRollup() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["seller-dashboard-sales-by-seller-rollup", filter],
    queryFn: () => apiFetch(`${endpoints.seller.dashboard.salesBySellerRollup}${qs}`),
  })
}

export function useSellerProfitBySeller() {
  const { filter } = useDashboardFilter()

  const qs = buildQuery({
    period: filter.period,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit: filter.limit,
  })

  return useQuery({
    queryKey: ["seller-dashboard-profit-by-seller", filter],
    queryFn: () => apiFetch(`${endpoints.seller.dashboard.profitBySeller}${qs}`),
  })
}

export function useSellerBalances() {
  return useQuery({
    queryKey: ["seller-dashboard-balances"],
    queryFn: () => apiFetch(endpoints.seller.dashboard.balances),
  })
}