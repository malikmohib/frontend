"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Copy } from "lucide-react"
import { useSellerRecentCouponEvents } from "@/lib/api/seller/oupon-events-recent"
import { useToast } from "@/hooks/use-toast"

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString([], { hour12: false })
}

function StatusPill({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    unused: "default",
    reserved: "secondary",
    used: "default",
    void: "destructive",
    voided: "destructive",
    failed: "destructive",
  }

  return (
    <Badge variant={variants[status] ?? "secondary"} className="text-[10px] transition-colors">
      {status}
    </Badge>
  )
}

function actorLabel(actorUserId: number | null) {
  // backend buckets to self + direct children (grandchildren hidden)
  return actorUserId === null ? "system" : String(actorUserId)
}

export function SellerCouponEvents() {
  const { toast } = useToast()

  const [limit] = React.useState(10)
  const [offset, setOffset] = React.useState(0)

  const eventsQ = useSellerRecentCouponEvents({ limit, offset })
  const events = eventsQ.data ?? []

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied" })
    } catch {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Recent Coupon Events</CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((x) => Math.max(0, x - limit))}
            disabled={offset === 0}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((x) => x + limit)}
            disabled={events.length < limit}
          >
            Next
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Time</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead className="w-[120px]">Actor</TableHead>
                <TableHead className="w-[140px]">Event</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsQ.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : events.length ? (
                events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(e.created_at)}
                    </TableCell>

                    <TableCell className="font-mono text-xs">{e.coupon_code}</TableCell>

                    <TableCell className="text-xs">{actorLabel(e.actor_user_id)}</TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px]">
                        {e.event_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      <StatusPill status={e.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copy(e.coupon_code)}
                        aria-label="Copy coupon code"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No events.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {eventsQ.isError ? (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to load events.
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}