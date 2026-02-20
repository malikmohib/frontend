"use client"

import { PageShell } from "@/components/page-shell"
import { StatsGrid } from "./stats-grid"
import { SalesCharts } from "./sales-charts"
import { HighlightCards } from "./highlight-cards"
import { DateFilter } from "./date-filter"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardFilterProvider } from "./dashboard-filter"

export default function SellerDashboardPage() {
  return (
    <DashboardFilterProvider>
      <PageShell title="Dashboard" subtitle="Your sales and direct network performance.">
        <div className="space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <DateFilter />
            </CardContent>
          </Card>

          <StatsGrid />
          <SalesCharts />
          <HighlightCards />
        </div>
      </PageShell>
    </DashboardFilterProvider>
  )
}