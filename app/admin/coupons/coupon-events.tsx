"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    <Badge variant={variants[status] ?? "secondary"} className="text-[10px]">
      {status}
    </Badge>
  )
}

function actorLabel(actorUserId: number | null) {
  return actorUserId === null ? "system" : String(actorUserId)
}

export function CouponEvents() {
  const limit = 10
  const [offset, setOffset] = React.useState(0)

  const q = useAdminRecentCouponEvents({ limit, offset })
  const items = q.data ?? []

  const canPrev = offset > 0
  const canNext = items.length === limit

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground">
          Recent Coupon Events
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Time</TableHead>
                <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs text-muted-foreground">Actor</TableHead>
                <TableHead className="text-xs text-muted-foreground">Coupon</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {q.isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {q.isError && (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-destructive">
                    Failed to load recent events.
                  </TableCell>
                </TableRow>
              )}

              {!q.isLoading && !q.isError && items.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No recent events.
                  </TableCell>
                </TableRow>
              )}

              {items.map((ev) => (
                <TableRow key={ev.id} className="border-border">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {formatTime(ev.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{ev.event_type}</TableCell>
                  <TableCell className="text-sm text-foreground">{actorLabel(ev.actor_user_id)}</TableCell>
                  <TableCell className="text-sm font-mono text-foreground">{ev.coupon_code}</TableCell>
                  <TableCell>
                    <StatusPill status={ev.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Offset: {offset} • Limit: {limit}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-9 px-3 rounded-md border bg-background text-sm disabled:opacity-50"
                disabled={!canPrev || q.isFetching}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
              >
                Prev
              </button>
              <button
                className="h-9 px-3 rounded-md border bg-background text-sm disabled:opacity-50"
                disabled={!canNext || q.isFetching}
                onClick={() => setOffset((o) => o + limit)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col gap-2 px-4 pb-4 md:hidden">
          {items.map((ev) => (
            <div key={ev.id} className="rounded-lg border border-border px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-medium text-foreground">
                  {ev.coupon_code}
                </span>
                <StatusPill status={ev.status} />
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{ev.event_type}</span>
                <span>by {actorLabel(ev.actor_user_id)}</span>
                <span className="ml-auto font-mono">{formatTime(ev.created_at)}</span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              className="h-9 px-3 rounded-md border bg-background text-sm disabled:opacity-50"
              disabled={!canPrev || q.isFetching}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Prev
            </button>
            <button
              className="h-9 px-3 rounded-md border bg-background text-sm disabled:opacity-50"
              disabled={!canNext || q.isFetching}
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
