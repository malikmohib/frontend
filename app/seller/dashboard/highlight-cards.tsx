"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Star } from "lucide-react"
import { useSellerDashboardSummaryRollup } from "@/lib/api/seller/dashboard"

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function HighlightCards() {
  const summaryQ = useSellerDashboardSummaryRollup()
  const summary = summaryQ.data as any

  const bestSeller = summary?.best_seller ?? {}
  const bestPlan = summary?.best_plan ?? {}

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">Best Seller</div>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="mt-3">
            <div className="text-lg font-bold text-foreground">
              {bestSeller?.username || "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Sales: {formatMoney(bestSeller?.sales_cents ?? 0)} • Orders:{" "}
              {(bestSeller?.orders_count ?? 0).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">Best Plan</div>
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="mt-3">
            <div className="text-lg font-bold text-foreground">
              {bestPlan?.plan_title || "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Sales: {formatMoney(bestPlan?.sales_cents ?? 0)} • Units:{" "}
              {(bestPlan?.units ?? 0).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}