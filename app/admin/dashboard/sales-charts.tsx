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

// Stable palette (keep your v0 colors)
const palette = [
  "hsl(215, 80%, 52%)",
  "hsl(165, 60%, 44%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(220, 20%, 20%)",
  "hsl(214, 20%, 60%)",
  "hsl(25, 60%, 48%)",
]

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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{percentage}%</span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      </div>
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
  const sum = items.reduce((a, b) => a + b.value, 0)

  return (
    <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
        </div>
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        {sum > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              style={{
                width: `${(item.value / sum) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          ))
        ) : (
          <div className="w-full bg-muted" />
        )}
      </div>
    </div>
  )
}

export function SalesCharts() {
  const plansQ = useAdminSalesByPlan()
  const sellersQ = useAdminSalesBySeller()

  const planItemsRaw: any[] = Array.isArray((plansQ.data as any)?.items)
    ? ((plansQ.data as any).items as any[])
    : []

  const sellerItemsRaw: any[] = Array.isArray((sellersQ.data as any)?.items)
    ? ((sellersQ.data as any).items as any[])
    : []

  // Map backend items -> v0 UI shape
  // Expected (based on your summary best_plan): plan_title, plan_category, sales_cents, orders_count, units
  const salesByPlan = planItemsRaw
    .slice()
    .sort((a, b) => (b?.sales_cents ?? 0) - (a?.sales_cents ?? 0))
    .slice(0, 6)
    .map((p, idx) => ({
      name: p?.plan_title || p?.plan_category || `Plan ${p?.plan_id ?? ""}`.trim() || "Unknown",
      salesCents: p?.sales_cents ?? 0,
      color: palette[idx % palette.length],
    }))

  const salesBySeller = sellerItemsRaw
    .slice()
    .sort((a, b) => (b?.sales_cents ?? 0) - (a?.sales_cents ?? 0))
    .slice(0, 6)
    .map((s, idx) => ({
      name: s?.seller_name || s?.name || `Seller ${s?.seller_id ?? ""}`.trim() || "Unknown",
      salesCents: s?.sales_cents ?? 0,
      color: palette[idx % palette.length],
    }))

  const planTotalCents = salesByPlan.reduce((a, b) => a + b.salesCents, 0)
  const sellerTotalCents = salesBySeller.reduce((a, b) => a + b.salesCents, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Sales by Plan
          </CardTitle>
          <p className="text-xs text-muted-foreground">Revenue distribution across plans</p>
        </CardHeader>

        <CardContent className="pt-2">
          {plansQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : salesByPlan.length === 0 ? (
            <div className="text-sm text-muted-foreground">No plan data yet.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {salesByPlan.map((item) => (
                  <CircleProgress
                    key={item.name}
                    percentage={
                      planTotalCents > 0 ? Math.round((item.salesCents / planTotalCents) * 100) : 0
                    }
                    label={item.name}
                    value={formatMoneyFromCents(item.salesCents)}
                    color={item.color}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Sales by Seller
          </CardTitle>
          <p className="text-xs text-muted-foreground">Performance breakdown by team member</p>
        </CardHeader>

        <CardContent className="pt-2">
          {sellersQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : salesBySeller.length === 0 ? (
            <div className="text-sm text-muted-foreground">No seller data yet.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {salesBySeller.map((item) => (
                  <CircleProgress
                    key={item.name}
                    percentage={
                      sellerTotalCents > 0
                        ? Math.round((item.salesCents / sellerTotalCents) * 100)
                        : 0
                    }
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
