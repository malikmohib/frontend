"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users } from "lucide-react"
import { useSellerSalesByPlanRollup, useSellerSalesBySellerRollup } from "@/lib/api/seller/dashboard"

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Stable palette
const palette = [
  "hsl(215, 80%, 52%)",
  "hsl(165, 60%, 44%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(220, 20%, 20%)",
  "hsl(214, 20%, 60%)",
  "hsl(25, 60%, 48%)",
]

function asArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function CircleProgress({
  percentage,
  label,
  value,
  color,
  size = 110,
}: {
  percentage: number
  label: string
  value: string
  color: string
  size?: number
}) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </svg>

      {/* Percentage center only (per your rule: no label inside donut) */}
      <div className="mt-[-88px] text-center">
        <div className="text-xl font-bold text-foreground">{percentage.toFixed(0)}%</div>
      </div>

      <div className="pt-8 text-center">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
    </div>
  )
}

export function SalesCharts() {
  const planQ = useSellerSalesByPlanRollup()
  const sellerQ = useSellerSalesBySellerRollup()

  const planItems = asArray<any>(planQ.data)
  const sellerItems = asArray<any>(sellerQ.data)

  const totalPlanSales = planItems.reduce((a, b) => a + (b.sales_cents ?? 0), 0) || 0
  const totalSellerSales = sellerItems.reduce((a, b) => a + (b.sales_cents ?? 0), 0) || 0

  const topPlans = planItems.slice(0, 5).map((p: any, idx: number) => {
    const sales = p.sales_cents ?? 0
    const pct = totalPlanSales ? (sales / totalPlanSales) * 100 : 0
    return {
      label: p.plan_title || `Plan #${p.plan_id}`,
      value: formatMoneyFromCents(sales),
      percentage: pct,
      color: palette[idx % palette.length],
    }
  })

  // IMPORTANT: sellerItems are already bucketed to self + direct children by backend rollup endpoint
  const topSellers = sellerItems.slice(0, 5).map((s: any, idx: number) => {
    const sales = s.sales_cents ?? 0
    const pct = totalSellerSales ? (sales / totalSellerSales) * 100 : 0
    return {
      label: s.username || `User #${s.user_id}`,
      value: formatMoneyFromCents(sales),
      percentage: pct,
      color: palette[idx % palette.length],
    }
  })

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Top Plans</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-4">
          {planQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {topPlans.length ? (
                topPlans.map((p) => (
                  <CircleProgress
                    key={p.label}
                    percentage={p.percentage}
                    label={p.label}
                    value={p.value}
                    color={p.color}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No data.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Top Sellers (Direct Rollup)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-4">
          {sellerQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {topSellers.length ? (
                topSellers.map((s) => (
                  <CircleProgress
                    key={s.label}
                    percentage={s.percentage}
                    label={s.label}
                    value={s.value}
                    color={s.color}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No data.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}