"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileJson } from "lucide-react"
import { useAdminOrderDetail } from "@/lib/api/admin/orders"
import { useMemo, useState } from "react"

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatOrderNo(orderNo: number) {
  // ORD-001 style
  const s = String(orderNo).padStart(3, "0")
  return `ORD-${s}`
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase()
  const variant =
    s === "completed" ? "default" : s === "pending" ? "secondary" : "destructive"
  return (
    <Badge variant={variant} className="mt-0.5 text-[10px]">
      {s || "unknown"}
    </Badge>
  )
}

export default function OrderDetailPage() {
  const params = useParams<{ orderNo: string }>()
  const orderNoParam = params?.orderNo
  const orderNo = Number(orderNoParam)

  const [showJson, setShowJson] = useState(false)

  const orderQ = useAdminOrderDetail(orderNo)
  const order = orderQ.data as any

  const items = useMemo(() => {
    const codes: string[] = Array.isArray(order?.coupon_codes) ? order.coupon_codes : []
    const serial: string = order?.serial ?? ""
    return codes.map((couponCode) => ({
      couponCode,
      serial: serial || "—",
    }))
  }, [order])

  return (
    <PageShell
      title={`Order ${orderNoParam ?? ""}`}
      subtitle="Order details and items"
      actions={
        <Link href="/admin/orders">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
      }
    >
      {orderQ.isLoading ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading order…
          </CardContent>
        </Card>
      ) : orderQ.error ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 text-sm text-red-600">
            {(orderQ.error as any)?.message ?? "Failed to load order"}
          </CardContent>
        </Card>
      ) : !order ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Order not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order No</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatOrderNo(order.order_no)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Buyer</p>
                  <p className="text-sm font-medium text-foreground">
                    {order.purchaser_username ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="text-sm font-medium text-foreground">
                    {order.plan_title ?? order.plan_category ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm font-medium text-foreground">
                    {order.quantity ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoneyFromCents(order.total_paid_cents ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={order.status ?? ""} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono text-foreground">
                    {order.tx_id ?? ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No items.</div>
                ) : (
                  items.map((item, i) => (
                    <div
                      key={`${item.couponCode}-${i}`}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-mono font-medium text-foreground">
                          {item.couponCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Serial: {item.serial}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        #{i + 1}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
              title="PDF endpoint not wired yet (paste Swagger endpoint)"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowJson((v) => !v)}
            >
              <FileJson className="h-3.5 w-3.5" />
              View Report JSON
            </Button>
          </div>

          {showJson ? (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Order JSON (temporary)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">
                  {JSON.stringify(order, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
