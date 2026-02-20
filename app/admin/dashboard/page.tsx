"use client"

import { PageShell } from "@/components/page-shell"
import { StatsGrid } from "./stats-grid"
import { SalesCharts } from "./sales-charts"
import { HighlightCards } from "./highlight-cards"
import { DateFilter } from "./date-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  useAdminDashboardSummary,
  useAdminSalesByPlan,
  useAdminSalesBySeller,
  useAdminProfitBySeller,
  useAdminBalances,
} from "@/lib/api/admin/dashboard"

import { DashboardFilterProvider } from "./dashboard-filter"

function DashboardInner() {
  const summary = useAdminDashboardSummary()
  const salesByPlan = useAdminSalesByPlan()
  const salesBySeller = useAdminSalesBySeller()
  const profitBySeller = useAdminProfitBySeller()
  const balances = useAdminBalances()

  const isLoading =
    summary.isLoading ||
    salesByPlan.isLoading ||
    salesBySeller.isLoading ||
    profitBySeller.isLoading ||
    balances.isLoading

  const error =
    summary.error ||
    salesByPlan.error ||
    salesBySeller.error ||
    profitBySeller.error ||
    balances.error

  return (
    <PageShell title="Dashboard" subtitle="Overview">
      <div className="space-y-4">
        <DateFilter />

        {isLoading ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 text-sm">Loading dashboard…</CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-500/30 bg-red-500/10 shadow-sm">
            <CardContent className="p-4 text-sm text-red-600">
              {(error as any)?.message ?? "Failed to load dashboard"}
            </CardContent>
          </Card>
        ) : null}

        <StatsGrid />
        <SalesCharts />
        <HighlightCards />

        {/* TEMP debug panel */}
        {!isLoading && !error ? (
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">API Debug (temporary)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <div className="font-medium mb-1">/admin/dashboard/summary</div>
                <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3">
                  {JSON.stringify(summary.data, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium mb-1">/admin/dashboard/sales-by-plan</div>
                <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3">
                  {JSON.stringify(salesByPlan.data, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium mb-1">/admin/dashboard/sales-by-seller</div>
                <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3">
                  {JSON.stringify(salesBySeller.data, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium mb-1">/admin/dashboard/profit-by-seller</div>
                <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3">
                  {JSON.stringify(profitBySeller.data, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium mb-1">/admin/dashboard/balances</div>
                <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3">
                  {JSON.stringify(balances.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  )
}

export default function DashboardPage() {
  return (
    <DashboardFilterProvider>
      <DashboardInner />
    </DashboardFilterProvider>
  )
}
