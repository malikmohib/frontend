"use client"

import { PageShell } from "@/components/page-shell"
import { StatsGrid } from "./stats-grid"
import { SalesCharts } from "./sales-charts"
import { HighlightCards } from "./highlight-cards"
import { DateFilter } from "./date-filter"
import { Card, CardContent } from "@/components/ui/card"

import {
  useAdminDashboardSummary,
  useAdminSalesByPlan,
  useAdminSalesBySeller,
  useAdminProfitBySeller,
  useAdminBalances,
} from "@/lib/api/admin/dashboard"

import { DashboardFilterProvider } from "./dashboard-filter"

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <div className="h-3 w-10 rounded bg-muted" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-7 w-28 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-56 w-full rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlight skeleton */}
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-7 w-24 rounded bg-muted" />
                <div className="h-3 w-44 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

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
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
          <DateFilter />
        </div>

        {error ? (
          <Card className="border-red-500/30 bg-red-500/10 shadow-sm animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
            <CardContent className="p-4 text-sm text-red-600">
              {(error as any)?.message ?? "Failed to load dashboard"}
            </CardContent>
          </Card>
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
              <StatsGrid />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
              <SalesCharts />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
              <HighlightCards />
            </div>
          </div>
        )}
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