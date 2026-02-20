"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent } from "@/components/ui/card"
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
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAdminOrders } from "@/lib/api/admin/orders"

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso: string) {
  // keep simple like your v0 sample: YYYY-MM-DD
  if (!iso) return ""
  return iso.slice(0, 10)
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase()
  const variant = s === "completed" ? "default" : s === "pending" ? "secondary" : "destructive"
  return (
    <Badge variant={variant} className="text-[10px]">
      {s || "unknown"}
    </Badge>
  )
}

type UiOrder = {
  orderNo: number
  date: string
  buyer: string
  plan: string
  qty: number
  total: string
  status: string
}

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("") // HTML date => YYYY-MM-DD
  const [limit] = useState<number>(50)
  const [offset, setOffset] = useState<number>(0)

  const queryParams = useMemo(() => {
    // Swagger supports status/date_from/date_to/limit/offset (+plan_id/buyer_user_id)
    // We will not guess server-side search, so search stays client-side for now.
    return {
      status: status === "all" ? null : status,
      date_from: dateFrom ? `${dateFrom}T00:00:00` : null,
      date_to: dateFrom ? `${dateFrom}T23:59:59` : null,
      limit,
      offset,
    }
  }, [status, dateFrom, limit, offset])

  const ordersQ = useAdminOrders(queryParams)

  const rawItems: any[] = Array.isArray((ordersQ.data as any)?.items) ? ((ordersQ.data as any).items as any[]) : []

  const uiOrders: UiOrder[] = useMemo(() => {
    const mapped = rawItems.map((o) => ({
      orderNo: o?.order_no ?? 0,
      date: formatDate(o?.created_at ?? ""),
      buyer: o?.purchaser_username ?? "",
      plan: o?.plan_title ?? o?.plan_category ?? "",
      qty: o?.quantity ?? 0,
      total: formatMoneyFromCents(o?.total_paid_cents ?? 0),
      status: o?.status ?? "",
    }))

    if (!search.trim()) return mapped

    const q = search.trim().toLowerCase()
    return mapped.filter((o) => {
      return (
        String(o.orderNo).includes(q) ||
        (o.buyer || "").toLowerCase().includes(q) ||
        (o.plan || "").toLowerCase().includes(q)
      )
    })
  }, [rawItems, search])

  const showingFrom = offset + 1
  const showingTo = offset + uiOrders.length
  const canPrev = offset > 0
  const canNext = rawItems.length === limit // if server returns full page, likely more exists

  return (
    <PageShell title="Orders" subtitle="Manage all orders">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order no, buyer, tx ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                className="w-36 bg-background"
                value={dateFrom}
                onChange={(e) => {
                  setOffset(0)
                  setDateFrom(e.target.value)
                }}
              />
              <Select
                value={status}
                onValueChange={(v) => {
                  setOffset(0)
                  setStatus(v)
                }}
              >
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {ordersQ.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading orders…</p>
          ) : ordersQ.error ? (
            <p className="mt-3 text-xs text-red-600">
              {(ordersQ.error as any)?.message ?? "Failed to load orders"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Order No</TableHead>
                <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs text-muted-foreground">Buyer</TableHead>
                <TableHead className="text-xs text-muted-foreground">Plan</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Qty</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Total</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ordersQ.isLoading && uiOrders.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                uiOrders.map((order) => (
                  <TableRow key={order.orderNo} className="border-border">
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.orderNo}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {order.orderNo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                    <TableCell className="text-sm text-foreground">{order.buyer}</TableCell>
                    <TableCell className="text-sm text-foreground">{order.plan}</TableCell>
                    <TableCell className="text-sm text-foreground text-right">{order.qty}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground text-right">
                      {order.total}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {!ordersQ.isLoading && uiOrders.length === 0 ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 text-sm text-muted-foreground">No orders found.</CardContent>
          </Card>
        ) : (
          uiOrders.map((order) => (
            <Link key={order.orderNo} href={`/admin/orders/${order.orderNo}`}>
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{order.orderNo}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-foreground">{order.buyer}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {order.plan} x{order.qty}
                    </span>
                    <span className="font-medium text-foreground">{order.total}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{order.date}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {uiOrders.length > 0 ? `Showing ${showingFrom}-${showingTo}` : "Showing 0"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {Math.floor(offset / limit) + 1}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => setOffset((o) => o + limit)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
