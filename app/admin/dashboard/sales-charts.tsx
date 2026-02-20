"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users } from "lucide-react"
import { useAdminSalesByPlan, useAdminSalesBySeller } from "@/lib/api/admin/dashboard"

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

/**
 * ✅ Normalize hook data into an array safely.
 * Handles: [] | {items: []} | {data: []} | {results: []} | undefined
 */
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
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(214, 20%, 93%)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* ✅ Center only percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>

      {/* ✅ Label outside */}
      <p
        title={label}
        className="max-w-[220px] text-center text-[11px] leading-4 text-muted-foreground"
        style={{ maxHeight: "32px", overflow: "hidden", wordBreak: "break-word" }}
      >
        {label}
      </p>

      <p className="text-xs text-muted-foreground">{value}</p>
    </div>
  )
}

function TotalBar({
  items,
  total,
  totalLabel,
  icon: Icon,
}: {
  items: { color: string; value: number }[]
  total: string
  totalLabel: string
  icon: React.ElementType
}) {
  const totalValue = items.reduce((acc, it) => acc + it.value, 0)
  const segments = items.map((it) => ({
    ...it,
    pct: totalValue > 0 ? (it.value / totalValue) * 100 : 0,
  }))

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1">
          <div className="text-lg font-semibold text-foreground tabular-nums">{total}</div>
          <div className="text-xs text-muted-foreground">{totalLabel}</div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="flex h-full w-full">
          {segments.map((s, idx) => (
            <div
              key={idx}
              className="h-full"
              style={{
                width: `${s.pct}%`,
                background: s.color,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SalesCharts() {
  const plansQ = useAdminSalesByPlan()
  const sellersQ = useAdminSalesBySeller()

  const plansRaw = asArray<any>(plansQ.data)
  const sellersRaw = asArray<any>(sellersQ.data)

  const planTotalCents = plansRaw.reduce(
    (acc, p) => acc + Number(p.salesCents ?? p.sales_cents ?? 0),
    0
  )

  const salesByPlan = plansRaw
    .map((p, idx) => {
      const cents = Number(p.salesCents ?? p.sales_cents ?? 0)
      return {
        name: String(p.planName ?? p.plan_name ?? p.title ?? "Plan"),
        salesCents: cents,
        percentage: planTotalCents > 0 ? Math.round((cents / planTotalCents) * 100) : 0,
        color: palette[idx % palette.length],
      }
    })
    .filter((x) => x.salesCents > 0)

  const sellerTotalCents = sellersRaw.reduce(
    (acc, s) => acc + Number(s.salesCents ?? s.sales_cents ?? 0),
    0
  )

  const salesBySeller = sellersRaw
    .map((s, idx) => {
      const cents = Number(s.salesCents ?? s.sales_cents ?? 0)
      return {
        name: String(s.sellerName ?? s.seller_name ?? s.username ?? "Seller"),
        salesCents: cents,
        percentage: sellerTotalCents > 0 ? Math.round((cents / sellerTotalCents) * 100) : 0,
        color: palette[idx % palette.length],
      }
    })
    .filter((x) => x.salesCents > 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sales by Plan</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue distribution across plans</p>
        </CardHeader>

        <CardContent>
          {plansQ.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : salesByPlan.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-6 py-2">
                {salesByPlan.slice(0, 3).map((item) => (
                  <CircleProgress
                    key={item.name}
                    percentage={item.percentage}
                    label={item.name}
                    value={formatMoneyFromCents(item.salesCents)}
                    color={item.color}
                    size={96}
                  />
                ))}
              </div>

              <TotalBar
                items={salesByPlan.map((p) => ({ color: p.color, value: p.salesCents }))}
                total={formatMoneyFromCents(planTotalCents)}
                totalLabel="Total revenue across all plans"
                icon={BarChart3}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sales by Seller</CardTitle>
          <p className="text-xs text-muted-foreground">Performance breakdown by team member</p>
        </CardHeader>

        <CardContent>
          {sellersQ.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : salesBySeller.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-6 py-2">
                {salesBySeller.slice(0, 3).map((item) => (
                  <CircleProgress
                    key={item.name}
                    percentage={item.percentage}
                    label={item.name}
                    value={formatMoneyFromCents(item.salesCents)}
                    color={item.color}
                    size={96}
                  />
                ))}
              </div>

              <TotalBar
                items={salesBySeller.map((s) => ({ color: s.color, value: s.salesCents }))}
                total={formatMoneyFromCents(sellerTotalCents)}
                totalLabel="Total revenue across all sellers"
                icon={Users}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}