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
import { Plus, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSellerAvailablePlans } from "@/lib/api/seller/plans"
import { sellerGenerateCoupons } from "@/lib/api/seller/coupons-actions"

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

export function SellerCouponActions() {
  const { toast } = useToast()

  const plansQ = useSellerAvailablePlans()

  const planOptions = React.useMemo(() => {
    const plans = plansQ.data ?? []
    // backend now returns only assigned plans; keep is_active guard anyway
    return plans.filter((p) => p.is_active).sort((a, b) => a.title.localeCompare(b.title))
  }, [plansQ.data])

  const hasPlans = planOptions.length > 0
  const isLoading = plansQ.isLoading

  const [planId, setPlanId] = React.useState<string>("")
  const [count, setCount] = React.useState<string>("10")
  const [notes, setNotes] = React.useState<string>("")

  const [submitting, setSubmitting] = React.useState(false)
  const [generatedCodes, setGeneratedCodes] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)

  // If plans list changes and current selection is invalid, clear it
  React.useEffect(() => {
    if (!planId) return
    const exists = planOptions.some((p) => String(p.id) === planId)
    if (!exists) setPlanId("")
  }, [planOptions, planId])

  async function onGenerate() {
    if (!hasPlans) {
      toast({
        title: "No plans assigned",
        description: "Ask your admin to assign plans to your account before generating coupons.",
        variant: "destructive",
      })
      return
    }

    const pid = parsePositiveInt(planId)
    const c = parsePositiveInt(count)

    if (!pid) {
      toast({ title: "Select a plan", variant: "destructive" })
      return
    }
    if (!c) {
      toast({ title: "Count must be a positive number", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const items = await sellerGenerateCoupons({
        plan_id: pid,
        count: c,
        notes: notes.trim() || undefined,
      })

      const codes = (items ?? []).map((x: any) => x.coupon_code).filter(Boolean)
      setGeneratedCodes(codes)

      toast({
        title: "Coupons generated",
        description: `Generated ${codes.length} coupon(s).`,
      })
    } catch (e: any) {
      toast({
        title: "Failed to generate coupons",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCode(code: string) {
    try {
      await toClipboard(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 1000)
    } catch {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  const disableGenerate = submitting || isLoading || !hasPlans

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Generate Coupons</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* No plans assigned banner */}
        {!isLoading && !plansQ.isError && !hasPlans ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">No plans assigned</div>
            <div className="mt-1 text-xs">
              You can’t generate coupons yet. Ask your admin to assign plans to your account.
            </div>
          </div>
        ) : null}

        {/* Load error */}
        {plansQ.isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to load plans.
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Plan</Label>
          <Select
            value={planId}
            onValueChange={setPlanId}
            disabled={isLoading || plansQ.isError || !hasPlans}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading plans..."
                    : !hasPlans
                      ? "No plans assigned"
                      : "Select a plan"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Count</Label>
            <Input
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="10"
              disabled={!hasPlans}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="optional"
              disabled={!hasPlans}
            />
          </div>
        </div>

        <Button className="w-full" onClick={onGenerate} disabled={disableGenerate}>
          <Plus className="mr-2 h-4 w-4" />
          {submitting ? "Generating..." : "Generate"}
        </Button>

        {generatedCodes.length ? (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-medium text-muted-foreground">Generated Codes</div>

            <div className="max-h-56 space-y-2 overflow-auto rounded-md border border-border bg-background p-2">
              {generatedCodes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="truncate font-mono text-xs">{code}</div>
                  <Button variant="ghost" size="icon" onClick={() => copyCode(code)} aria-label="Copy code">
                    {copied === code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}