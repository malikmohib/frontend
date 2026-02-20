"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Copy, Search } from "lucide-react"
import { useAdminRecentCouponEvents } from "@/lib/api/admin/coupon-events-recent"

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString([], { hour12: false })
}

function StatusPill({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    available: "default",
    reserved: "secondary",
    voided: "destructive",
    failed: "destructive",
  }
  return (
    <Badge
      variant={variants[status] ?? "secondary"}
      className="text-[10px] transition-colors"
    >
      {status}
    </Badge>
  )
}

function actorLabel(actorUserId: number | null) {
  return actorUserId === null ? "system" : String(actorUserId)
}

function includesInsensitive(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export function CouponEvents() {
  const limit = 10
  const [offset, setOffset] = React.useState(0)
  const [filter, setFilter] = React.useState("")

  const q = useAdminRecentCouponEvents({ limit, offset })
  const items = q.data ?? []

  const canPrev = offset > 0
  const canNext = items.length === limit

  const visibleItems = React.useMemo(() => {
    const f = filter.trim()
    if (!f) return items

    return items.filter((ev) => {
      return (
        includesInsensitive(ev.coupon_code ?? "", f) ||
        includesInsensitive(ev.event_type ?? "", f) ||
        includesInsensitive(String(ev.actor_user_id ?? "system"), f) ||
        includesInsensitive(ev.status ?? "", f)
      )
    })
  }, [items, filter])

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // ignore (some browsers block clipboard without HTTPS)
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Recent Coupon Events
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 bg-background h-9"
                placeholder="Filter events…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!canPrev || q.isFetching}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!canNext || q.isFetching}
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Offset: {offset} • Limit: {limit}
          {filter.trim() ? ` • Showing: ${visibleItems.length}/${items.length}` : ""}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="max-h-[58vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Time</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Actor</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Coupon</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="w-[56px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {q.isLoading && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}

                {q.isError && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-destructive"
                    >
                      Failed to load recent events.
                    </TableCell>
                  </TableRow>
                )}

                {!q.isLoading && !q.isError && visibleItems.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      {filter.trim() ? "No events match your filter." : "No recent events."}
                    </TableCell>
                  </TableRow>
                )}

                {visibleItems.map((ev, idx) => (
                  <TableRow
                    key={ev.id}
                    className="border-border transition-colors hover:bg-secondary/50 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(idx * 25, 150)}ms` }}
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatTime(ev.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{ev.event_type}</TableCell>
                    <TableCell className="text-sm text-foreground">
                      {actorLabel(ev.actor_user_id)}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-foreground">
                      {ev.coupon_code}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={ev.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyCoupon(ev.coupon_code)}
                        title="Copy coupon code"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col gap-2 px-4 pb-4 md:hidden">
          {visibleItems.map((ev, idx) => (
            <div
              key={ev.id}
              className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-secondary/40 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
              style={{ animationDelay: `${Math.min(idx * 25, 150)}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-medium text-foreground">
                  {ev.coupon_code}
                </span>
                <div className="flex items-center gap-2">
                  <StatusPill status={ev.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyCoupon(ev.coupon_code)}
                    title="Copy coupon code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{ev.event_type}</span>
                <span>by {actorLabel(ev.actor_user_id)}</span>
                <span className="ml-auto font-mono">{formatTime(ev.created_at)}</span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!canPrev || q.isFetching}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!canNext || q.isFetching}
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
