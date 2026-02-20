import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Medal, Award } from "lucide-react"
import {
  useAdminDashboardSummary,
  useAdminSalesByPlan,
  useAdminSalesBySeller,
} from "@/lib/api/admin/dashboard"

const rankIcons = [Crown, Medal, Award]
const rankLabels = ["1st", "2nd", "3rd"]

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function LeaderboardItem({
  rank,
  name,
  salesCents,
  orders,
  color,
  maxSalesCents,
}: {
  rank: number
  name: string
  salesCents: number
  orders: number
  color: string
  maxSalesCents: number
}) {
  const Icon = rankIcons[rank - 1]
  const pct = maxSalesCents > 0 ? (salesCents / maxSalesCents) * 100 : 0

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {rankLabels[rank - 1]}
          </span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{formatMoney(salesCents)}</p>
          <p className="text-[10px] text-muted-foreground">{orders} orders</p>
        </div>
      </div>
    </div>
  )
}

const rankColors = ["hsl(38, 92%, 50%)", "hsl(214, 20%, 60%)", "hsl(25, 60%, 48%)"]

export function HighlightCards() {
  const summaryQ = useAdminDashboardSummary()
  const plansQ = useAdminSalesByPlan()
  const sellersQ = useAdminSalesBySeller()

  const summary = summaryQ.data as any
  const plans = plansQ.data as any
  const sellers = sellersQ.data as any

  // Expected API shapes (based on your screenshot):
  // plans.items: [{ plan_id, plan_title, plan_category, sales_cents, orders_count, units }]
  // sellers.items: [{ seller_id?, seller_name?, sales_cents, orders_count, units }]
  const planItems: any[] = Array.isArray(plans?.items) ? plans.items : []
  const sellerItems: any[] = Array.isArray(sellers?.items) ? sellers.items : []

  const topPlans = planItems
    .slice()
    .sort((a, b) => (b?.sales_cents ?? 0) - (a?.sales_cents ?? 0))
    .slice(0, 3)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p?.plan_title || p?.plan_category || `Plan ${p?.plan_id ?? ""}`.trim() || "Unknown",
      salesCents: p?.sales_cents ?? 0,
      orders: p?.orders_count ?? 0,
      color: rankColors[idx]!,
    }))

  const topSellers = sellerItems
    .slice()
    .sort((a, b) => (b?.sales_cents ?? 0) - (a?.sales_cents ?? 0))
    .slice(0, 3)
    .map((s, idx) => ({
      rank: idx + 1,
      name: s?.seller_name || s?.name || `Seller ${s?.seller_id ?? ""}`.trim() || "Unknown",
      salesCents: s?.sales_cents ?? 0,
      orders: s?.orders_count ?? 0,
      color: rankColors[idx]!,
    }))

  const maxPlanSales = topPlans[0]?.salesCents ?? 0
  const maxSellerSales = topSellers[0]?.salesCents ?? 0

  // If there are no items yet, show fallback using summary.best_plan (already present)
  const bestPlan = summary?.best_plan
  const fallbackPlans =
    bestPlan && (bestPlan?.sales_cents ?? 0) > 0
      ? [
          {
            rank: 1,
            name: bestPlan?.plan_title || bestPlan?.plan_category || "Best Plan",
            salesCents: bestPlan?.sales_cents ?? 0,
            orders: bestPlan?.orders_count ?? 0,
            color: rankColors[0]!,
          },
        ]
      : []

  const plansToRender = topPlans.length ? topPlans : fallbackPlans
  const sellersToRender = topSellers.length ? topSellers : []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Top 3 Plans
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Highest revenue plans this period
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 pt-1">
          {plansToRender.length ? (
            plansToRender.map((plan) => (
              <LeaderboardItem
                key={`${plan.rank}-${plan.name}`}
                rank={plan.rank}
                name={plan.name}
                salesCents={plan.salesCents}
                orders={plan.orders}
                color={plan.color}
                maxSalesCents={Math.max(maxPlanSales, plan.salesCents)}
              />
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No plan sales yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Top 3 Sellers
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Best performing team members
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 pt-1">
          {sellersToRender.length ? (
            sellersToRender.map((seller) => (
              <LeaderboardItem
                key={`${seller.rank}-${seller.name}`}
                rank={seller.rank}
                name={seller.name}
                salesCents={seller.salesCents}
                orders={seller.orders}
                color={seller.color}
                maxSalesCents={Math.max(maxSellerSales, seller.salesCents)}
              />
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No seller sales yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
