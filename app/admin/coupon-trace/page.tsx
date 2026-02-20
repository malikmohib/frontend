"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { useAdminCouponTrace } from "@/lib/api/admin/coupon-trace"

function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase()
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    available: "default",
    reserved: "secondary",
    used: "default",
    voided: "destructive",
    failed: "destructive",
  }
  return (
    <Badge variant={variants[s] ?? "secondary"} className="text-[10px]">
      {s || "unknown"}
    </Badge>
  )
}

function fmtMaybe(v: any) {
  if (v === undefined || v === null || v === "") return "---"
  return String(v)
}

function fmtIso(iso: string) {
  if (!iso) return "---"
  // Keep readable but simple
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function CouponTracePage() {
  const [searched, setSearched] = useState(false)
  const [includeEvents, setIncludeEvents] = useState(true)

  const [couponCode, setCouponCode] = useState("")

  const traceQ = useAdminCouponTrace(searched ? couponCode : "", includeEvents)
  const trace = traceQ.data as any

  // Derive a status label from what backend provides (no guessing fields beyond screenshot).
  const status = useMemo(() => {
    // If coupon trace response includes something like status, use it.
    // Otherwise infer based on reserved_at / used_at / last_failed_at / voided flags (not shown in screenshot).
    if (trace?.status) return String(trace.status)
    if (trace?.used_at) return "used"
    if (trace?.reserved_at) return "reserved"
    if (trace?.last_failed_at || trace?.last_failure_reason) return "failed"
    return "available"
  }, [trace])

  const events: any[] = useMemo(() => {
    if (!includeEvents) return []
    return Array.isArray(trace?.events) ? trace.events : []
  }, [trace, includeEvents])

  return (
    <PageShell title="Coupon Trace" subtitle="Look up coupon status and event history">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Coupon Code</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g. CPN-A1B2C3"
                  className="pl-9 bg-background"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearched(true)
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="include-events"
                  checked={includeEvents}
                  onCheckedChange={(v) => {
                    setIncludeEvents(v)
                    // if already searched, this will refetch automatically due to queryKey change
                  }}
                />
                <Label htmlFor="include-events" className="text-xs text-muted-foreground">
                  Include events
                </Label>
              </div>
              <Button
                size="sm"
                onClick={() => setSearched(true)}
                disabled={!couponCode.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {searched && traceQ.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
          ) : null}

          {searched && traceQ.error ? (
            <p className="mt-3 text-xs text-red-600">
              {(traceQ.error as any)?.message ?? "Failed to fetch coupon trace"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {searched && !traceQ.isLoading && !traceQ.error && trace ? (
        <>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                Coupon Status
                <StatusPill status={status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Coupon Code</p>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {couponCode.trim()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm text-foreground">
                    {fmtMaybe(trace.owner_username)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Reserved By</p>
                  <p className="text-sm text-foreground">
                    {fmtMaybe(trace.reserved_by_username)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Used By</p>
                  <p className="text-sm text-foreground">
                    {fmtMaybe(trace.used_by_username)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Reserved UDID</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtMaybe(trace.reserved_udid)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Used UDID</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtMaybe(trace.used_udid)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Reserved At</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtIso(trace.reserved_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Used At</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtIso(trace.used_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Provider Ref ID</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtMaybe(trace.provider_ref_id)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Order No</p>
                  {trace.order_no ? (
                    <Link
                      href={`/admin/orders/${trace.order_no}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {trace.order_no}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">---</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtMaybe(trace.tx_id)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{fmtMaybe(trace.notes)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Failure Reason</p>
                  <p className="text-sm text-foreground">
                    {fmtMaybe(trace.last_failure_reason)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Failed Step</p>
                  <p className="text-sm text-foreground">
                    {fmtMaybe(trace.last_failed_step)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Failed At</p>
                  <p className="text-sm font-mono text-foreground">
                    {fmtIso(trace.last_failed_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {includeEvents ? (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">
                  Events Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events.</p>
                ) : (
                  <div className="relative flex flex-col gap-0">
                    {events.map((event, i) => (
                      <div key={event?.id ?? i} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < events.length - 1 && (
                          <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
                        )}
                        <div className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-card" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground capitalize">
                              {fmtMaybe(event.event_type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              by {fmtMaybe(event.actor_username)}
                            </span>
                          </div>

                          {/* meta is an object; render key-values compactly */}
                          {event?.meta ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {typeof event.meta === "string"
                                ? event.meta
                                : JSON.stringify(event.meta)}
                            </p>
                          ) : null}

                          <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">
                            {fmtIso(event.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </PageShell>
  )
}
