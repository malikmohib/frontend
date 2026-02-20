"use client"

import * as React from "react"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileJson, FileText } from "lucide-react"
import { useAdminUsersTree } from "@/lib/api/admin/users-tree"
import { useAdminOrdersReport, downloadAdminSellerOrdersPdf } from "@/lib/api/admin/reports"

// Radix/shadcn SelectItem cannot have value=""
const ALL_SELLERS_VALUE = "__all__"

// Swagger says date_from/date_to are date-time.
// Convert YYYY-MM-DD -> YYYY-MM-DDT00:00:00Z (safe, backend-friendly).
function toDateTimeFromDateInput(date: string) {
  if (!date) return null
  return `${date}T00:00:00Z`
}

function formatUsdFromCents(cents: number) {
  const sign = cents < 0 ? "-" : ""
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const rem = abs % 100
  return `${sign}$${dollars.toString()}.${rem.toString().padStart(2, "0")}`
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

export default function ReportsPage() {
  // Sellers dropdown (real)
  const usersTreeQ = useAdminUsersTree()
  const sellerOptions = React.useMemo(() => {
    const items = usersTreeQ.data?.items ?? []
    const usernames = items
      .filter((u) => u.role === "seller" && u.is_active)
      .map((u) => u.username)
    return Array.from(new Set(usernames)).sort((a, b) => a.localeCompare(b))
  }, [usersTreeQ.data])

  // Filters (UI)
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [planId, setPlanId] = React.useState<string>("all")

  // Default: ALL sellers
  const [username, setUsername] = React.useState<string>(ALL_SELLERS_VALUE)

  const appliedUsername = username === ALL_SELLERS_VALUE ? "" : username.trim()

  // Fetch report (live updates as filters change)
  // IMPORTANT: username is OPTIONAL now ("" => all sellers below me)
  const reportQ = useAdminOrdersReport({
    username: appliedUsername || null,
    plan_id: planId === "all" ? null : Number(planId),
    date_from: toDateTimeFromDateInput(dateFrom),
    date_to: toDateTimeFromDateInput(dateTo),
    limit: 5000,
    offset: 0,
  })

  const items = reportQ.data?.items ?? []

  // Build Plan dropdown options from returned report items
  const planOptions = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const it of items) {
      if (!map.has(it.plan_id)) map.set(it.plan_id, it.plan_title)
    }
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [items])

  // Summary metrics derived from report items
  const totalRevenueCents = React.useMemo(() => {
    let sum = 0
    for (const it of items) sum += it.total_paid_cents
    return sum
  }, [items])

  const totalOrders = reportQ.data?.total ?? 0

  const totalUnits = React.useMemo(() => {
    let units = 0
    for (const it of items) units += it.quantity
    return units
  }, [items])

  const avgOrderValueCents = React.useMemo(() => {
    if (!totalOrders) return 0
    return Math.floor(totalRevenueCents / totalOrders)
  }, [totalRevenueCents, totalOrders])

  // Active Sellers:
  // - If specific seller selected => 1
  // - If ALL sellers => use dropdown count (report items don't include seller username)
  const activeSellers = React.useMemo(() => {
    if (appliedUsername) return 1
    return sellerOptions.length
  }, [appliedUsername, sellerOptions.length])

  // Preview table grouped by plan
  const rowsByPlan = React.useMemo(() => {
    const map = new Map<
      number,
      {
        plan: string
        orders: number
        units: number
        revenueCents: number
        unitPriceCents: number
      }
    >()

    for (const it of items) {
      const cur = map.get(it.plan_id) ?? {
        plan: it.plan_title,
        orders: 0,
        units: 0,
        revenueCents: 0,
        unitPriceCents: it.unit_price_cents,
      }
      cur.orders += 1
      cur.units += it.quantity
      cur.revenueCents += it.total_paid_cents
      map.set(it.plan_id, cur)
    }

    const rows = Array.from(map.values()).map((r) => {
      const avgPriceCents = r.units > 0 ? Math.floor(r.revenueCents / r.units) : 0
      return {
        plan: r.plan,
        orders: r.orders,
        units: r.units,
        revenue: formatUsdFromCents(r.revenueCents),
        avgPrice: formatUsdFromCents(avgPriceCents),
      }
    })

    rows.sort((a, b) => b.orders - a.orders)
    return rows
  }, [items])

  const [downloading, setDownloading] = React.useState<null | "json" | "pdf">(null)
  const [errorMsg, setErrorMsg] = React.useState("")

  async function onDownloadJson() {
    setErrorMsg("")
    try {
      setDownloading("json")
      const res = await reportQ.refetch()
      const payload = res.data

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      const href = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = href

      const name = appliedUsername ? appliedUsername : "all-sellers"
      a.download = `orders-report-${name}.json`

      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to download JSON.")
    } finally {
      setDownloading(null)
    }
  }

  async function onDownloadPdf() {
    setErrorMsg("")
    try {
      setDownloading("pdf")
      await downloadAdminSellerOrdersPdf({
        // allow null/empty => all sellers below me (backend supports this in your hooks)
        username: appliedUsername || null,
        plan_id: planId === "all" ? null : Number(planId),
        date_from: toDateTimeFromDateInput(dateFrom),
        date_to: toDateTimeFromDateInput(dateTo),
        limit: 5000,
      })
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to download PDF.")
    } finally {
      setDownloading(null)
    }
  }

  // Export is always allowed now (all sellers or specific seller)
  const canExport = true

  return (
    <PageShell title="Reports" subtitle="Generate and download reports">
      {/* Filters */}
      <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              type="date"
              className="w-40 bg-background"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              className="w-40 bg-background"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            {/* Plan dropdown (real from report items) */}
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="w-44 bg-background">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {planOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seller dropdown (real) */}
            <Select value={username} onValueChange={setUsername}>
              <SelectTrigger className="w-44 bg-background">
                <SelectValue placeholder="Seller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SELLERS_VALUE}>All sellers</SelectItem>

                {usersTreeQ.isLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading…
                  </SelectItem>
                )}
                {usersTreeQ.isError && (
                  <SelectItem value="__error" disabled>
                    Failed to load sellers
                  </SelectItem>
                )}
                {!usersTreeQ.isLoading &&
                  !usersTreeQ.isError &&
                  sellerOptions.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      No sellers found
                    </SelectItem>
                  )}
                {sellerOptions.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 sm:ml-auto">
              {reportQ.isFetching ? (
                <Badge variant="secondary" className="text-[10px]">
                  Loading…
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  {rowsByPlan.length} plan(s)
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileJson className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Download JSON</p>
              <p className="text-xs text-muted-foreground">Export raw report data as JSON</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onDownloadJson}
              disabled={!canExport || downloading !== null}
            >
              <Download className="h-3.5 w-3.5" />
              {downloading === "json" ? "Exporting…" : "Export"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Download PDF</p>
              <p className="text-xs text-muted-foreground">Export formatted PDF report</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onDownloadPdf}
              disabled={!canExport || downloading !== null}
            >
              <Download className="h-3.5 w-3.5" />
              {downloading === "pdf" ? "Exporting…" : "Export"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {errorMsg && <div className="text-sm text-destructive">{errorMsg}</div>}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatUsdFromCents(totalRevenueCents)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(totalOrders)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatUsdFromCents(avgOrderValueCents)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Avg. Order Value</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(activeSellers)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Active Sellers</p>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card className="border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            Report Preview
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">Plan</TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Orders
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Units
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Revenue
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Avg Price
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reportQ.isFetching && (
                    <TableRow className="border-border">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}

                  {reportQ.isError && (
                    <TableRow className="border-border">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-destructive"
                      >
                        Failed to load report.
                      </TableCell>
                    </TableRow>
                  )}

                  {!reportQ.isFetching && !reportQ.isError && rowsByPlan.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No data.
                      </TableCell>
                    </TableRow>
                  )}

                  {rowsByPlan.map((row, idx) => (
                    <TableRow
                      key={row.plan}
                      className="border-border transition-colors hover:bg-secondary/50 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                      style={{ animationDelay: `${Math.min(idx * 12, 160)}ms` }}
                    >
                      <TableCell className="text-sm font-medium text-foreground">
                        {row.plan}
                      </TableCell>
                      <TableCell className="text-sm text-foreground text-right tabular-nums">
                        {formatNumber(row.orders)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground text-right tabular-nums">
                        {formatNumber(row.units)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground text-right tabular-nums">
                        {row.revenue}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                        {row.avgPrice}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2 px-4 pb-4 md:hidden">
            {reportQ.isFetching && (
              <div className="py-4 text-sm text-muted-foreground">Loading…</div>
            )}

            {reportQ.isError && (
              <div className="py-4 text-sm text-destructive">Failed to load report.</div>
            )}

            {!reportQ.isFetching && !reportQ.isError && rowsByPlan.length === 0 && (
              <div className="py-4 text-sm text-muted-foreground">No data.</div>
            )}

            {rowsByPlan.map((row, idx) => (
              <div
                key={row.plan}
                className="rounded-lg border border-border px-3 py-2.5 bg-card shadow-sm transition-colors hover:bg-secondary/40 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(idx * 18, 160)}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{row.plan}</span>
                  <span className="text-sm font-semibold text-foreground">{row.revenue}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(row.orders)} orders</span>
                  <span>{formatNumber(row.units)} units</span>
                  <span className="ml-auto">avg {row.avgPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}