"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Undo2, Copy, Check } from "lucide-react"
import { useAdminPlans } from "@/lib/api/admin/plans"
import {
  adminGenerateCoupons,
  adminUnreserveCoupon,
} from "@/lib/api/admin/coupons-actions"
import { useToast } from "@/hooks/use-toast"

function parsePositiveInt(value: string) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const i = Math.floor(n)
  if (i <= 0) return null
  return i
}

function toClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function CouponActions() {
  const { toast } = useToast()

  const plansQ = useAdminPlans()

  const planOptions = React.useMemo(() => {
    const plans = plansQ.data ?? []
    return plans
      .filter((p) => p.is_active)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [plansQ.data])

  // Generate
  const [planId, setPlanId] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [generatedCodes, setGeneratedCodes] = React.useState<string[]>([])

  // Unreserve
  const [couponCode, setCouponCode] = React.useState<string>("")
  const [reason, setReason] = React.useState<string>("")

  const [busy, setBusy] = React.useState<null | "generate" | "unreserve">(null)

  const [genMsg, setGenMsg] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  const [unreserveMsg, setUnreserveMsg] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  const [copiedOne, setCopiedOne] = React.useState<string | null>(null)
  const [copiedAll, setCopiedAll] = React.useState<boolean>(false)

  // find selected plan name
  const selectedPlanTitle = React.useMemo(() => {
    const pid = Number(planId)
    if (!pid) return ""
    const p = planOptions.find((x) => x.id === pid)
    return p?.title ?? ""
  }, [planId, planOptions])

  async function onGenerate() {
    setGenMsg(null)
    setCopiedOne(null)
    setCopiedAll(false)

    const pid = parsePositiveInt(planId)
    const count = parsePositiveInt(quantity)

    if (!pid) {
      setGenMsg({ kind: "err", text: "Please select a plan." })
      return
    }
    if (!count) {
      setGenMsg({ kind: "err", text: "Please enter a valid quantity." })
      return
    }

    try {
      setBusy("generate")

      const res = await adminGenerateCoupons({
        plan_id: pid,
        count,
        notes: notes ?? "",
      })

      const codes = (res ?? [])
        .map((c: any) => c?.coupon_code)
        .filter((x: any) => typeof x === "string" && x.length > 0)

      setGeneratedCodes(codes)

      setGenMsg({ kind: "ok", text: `Generated ${codes.length} coupon(s).` })

      // toast popup
      toast({
        title: `Generated ${codes.length} key(s)`,
        description: (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Plan:{" "}
              <span className="font-medium text-foreground">
                {selectedPlanTitle || `#${pid}`}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Quantity:{" "}
              <span className="font-medium text-foreground">{count}</span>
            </div>

            <div className="max-h-40 overflow-auto rounded-md border bg-background p-2">
              <div className="space-y-1">
                {codes.slice(0, 10).map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-xs">{c}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(c)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>

              {codes.length > 10 && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Showing first 10 keys (total {codes.length})
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(codes.join("\n"))}
            >
              Copy All
            </Button>
          </div>
        ),
      })
    } catch (e: any) {
      setGenMsg({ kind: "err", text: e?.message ?? "Generate failed." })
    } finally {
      setBusy(null)
    }
  }

  async function onCopyOne(code: string) {
    await toClipboard(code)
    setCopiedOne(code)
    setTimeout(() => setCopiedOne(null), 900)
  }

  async function onCopyAll() {
    const text = generatedCodes.join("\n")
    if (!text) return
    await toClipboard(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 900)
  }

  async function onUnreserve() {
    setUnreserveMsg(null)

    const code = couponCode.trim()
    const r = reason.trim()

    if (!code) {
      setUnreserveMsg({ kind: "err", text: "Please enter a coupon code." })
      return
    }
    if (!r) {
      setUnreserveMsg({ kind: "err", text: "Please enter a reason." })
      return
    }

    try {
      setBusy("unreserve")
      await adminUnreserveCoupon(code, { reason: r })
      setUnreserveMsg({ kind: "ok", text: "Coupon unreserved successfully." })
      setCouponCode("")
      setReason("")
    } catch (e: any) {
      let text = "Unreserve failed."

      const raw =
        (typeof e?.message === "string" && e.message) ||
        (typeof e === "string" && e) ||
        ""

      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed?.detail) text = String(parsed.detail)
          else text = raw
        } catch {
          text = raw
        }
      } else if (e?.detail) {
        text = String(e.detail)
      }

      if (text.toLowerCase().includes("not reserved")) {
        text = "This coupon is not reserved. Only reserved coupons can be unreserved."
      }

      setUnreserveMsg({ kind: "err", text })
    } finally {
      setBusy(null)
    }
  }

  const pidOk = parsePositiveInt(planId)
  const qtyOk = parsePositiveInt(quantity)

  return (
    <div className="flex flex-col gap-3">
      {/* Generate */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Plus className="h-4 w-4 text-muted-foreground" />
            Generate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <div className="mt-1">
                <Select
                  value={planId}
                  onValueChange={(v) => {
                    setPlanId(v)
                    setGeneratedCodes([])
                    setGenMsg(null)
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plansQ.isLoading && (
                      <SelectItem value="__loading" disabled>
                        Loading…
                      </SelectItem>
                    )}
                    {plansQ.isError && (
                      <SelectItem value="__error" disabled>
                        Failed to load plans
                      </SelectItem>
                    )}
                    {!plansQ.isLoading &&
                      !plansQ.isError &&
                      planOptions.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          No active plans
                        </SelectItem>
                      )}
                    {planOptions.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                placeholder="e.g. 10"
                className="mt-1 bg-background"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input
                placeholder="optional"
                className="mt-1 bg-background"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={onGenerate}
              disabled={busy !== null || !pidOk || !qtyOk}
            >
              {busy === "generate" ? "Generating…" : "Generate"}
            </Button>

            {genMsg && (
              <div
                className={`text-xs ${
                  genMsg.kind === "ok"
                    ? "text-muted-foreground"
                    : "text-destructive"
                }`}
              >
                {genMsg.text}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Results Card */}
      {generatedCodes.length > 0 && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">
                Generated Coupons
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onCopyAll}
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy All
                  </>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {generatedCodes.length} key(s)
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              {generatedCodes.map((code) => (
                <div
                  key={code}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="flex-1 font-mono text-xs text-foreground">
                    {code}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onCopyOne(code)}
                  >
                    {copiedOne === code ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unreserve */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Undo2 className="h-4 w-4 text-muted-foreground" />
            Unreserve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Coupon Code</Label>
              <Input
                placeholder="e.g. CPN-A1B2C3"
                className="mt-1 bg-background"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Input
                placeholder="e.g. wrong reservation"
                className="mt-1 bg-background"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={onUnreserve}
              disabled={busy !== null}
            >
              {busy === "unreserve" ? "Unreserving…" : "Unreserve"}
            </Button>

            {unreserveMsg && (
              <div
                className={`text-xs ${
                  unreserveMsg.kind === "ok"
                    ? "text-muted-foreground"
                    : "text-destructive"
                }`}
              >
                {unreserveMsg.text}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
