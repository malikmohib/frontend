import { Card, CardContent } from "@/components/ui/card"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Building2,
  TrendingUp,
  PiggyBank,
} from "lucide-react"

import { useAdminDashboardSummary } from "@/lib/api/admin/dashboard"

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function StatsGrid() {
  const summaryQuery = useAdminDashboardSummary()
  const summary = summaryQuery.data as any

  const totals = summary?.totals ?? {}

  const totalSalesCents = totals?.sales_cents ?? 0
  const totalOrders = totals?.orders_count ?? 0
  const totalUnits = totals?.units ?? 0

  // NOTE: backend summary currently doesn't include admin_base/admin_profit/total_profit
  // We'll keep these as 0 until we add them in backend or read them from other endpoint.
  const adminBaseCents = summary?.admin_base_cents ?? 0
  const adminProfitCents = summary?.admin_profit_cents ?? 0
  const totalProfitCents = summary?.total_profit_cents ?? 0

  const stats = [
    {
      label: "Total Sales",
      value: formatMoney(totalSalesCents),
      icon: DollarSign,
      change: "",
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: "",
    },
    {
      label: "Total Units",
      value: totalUnits.toLocaleString(),
      icon: Package,
      change: "",
    },
    {
      label: "Admin Base",
      value: formatMoney(adminBaseCents),
      icon: Building2,
      change: "",
    },
    {
      label: "Admin Profit",
      value: formatMoney(adminProfitCents),
      icon: TrendingUp,
      change: "",
    },
    {
      label: "Total Profit",
      value: formatMoney(totalProfitCents),
      icon: PiggyBank,
      change: "",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-accent">
                {stat.change || ""}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
