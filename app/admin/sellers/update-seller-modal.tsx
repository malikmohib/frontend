"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Minus, Plus, Trash2 } from "lucide-react"
import type { AdminSeller } from "@/lib/api/admin/sellers"
import { useAdminPlans } from "@/lib/api/admin/plans"
import { apiFetch } from "@/lib/api/http"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type PlanRow = {
  id: number // plan_id
  name: string // title
  priceCents: number
}

interface UpdateSellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: AdminSeller
}

function centsToDollarsString(cents: number) {
  const v = (Number(cents) || 0) / 100
  return v.toFixed(2)
}

function dollarsStringToCents(v: string) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

function dollarsToCents(deltaDollars: number) {
  return Math.round(deltaDollars * 100)
}

type PatchSellerPayload = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
  role?: "admin" | "seller" | "agent" | string
  is_active?: boolean
  plans?: Array<{ plan_id: number; price_cents: number }>
}

type SetBalancePayload = {
  target_balance_cents: number
  note?: string
}

async function patchSeller(sellerId: number, body: PatchSellerPayload) {
  return apiFetch(`/admin/sellers/${sellerId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

async function setSellerBalance(sellerId: number, body: SetBalancePayload) {
  return apiFetch(`/admin/sellers/${sellerId}/balance`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function UpdateSellerModal({ open, onOpenChange, seller }: UpdateSellerModalProps) {
  const { data: plansList } = useAdminPlans()
  const qc = useQueryClient()

  const [plans, setPlans] = useState<PlanRow[]>([])
  const [balanceAdjust, setBalanceAdjust] = useState(0) // ✅ this is TARGET balance in dollars
  const [submitted, setSubmitted] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [role, setRole] = useState("seller")

  const [addPlanId, setAddPlanId] = useState<string>("")
  const [addPlanPriceUsd, setAddPlanPriceUsd] = useState<string>("")

  const patchSellerMut = useMutation({
    mutationFn: (body: PatchSellerPayload) => patchSeller(Number(seller.id), body),
  })

  const setBalanceMut = useMutation({
    mutationFn: (body: SetBalancePayload) => setSellerBalance(Number(seller.id), body),
  })

  useEffect(() => {
    if (!open) return

    setSubmitted(false)

    // ✅ show current balance as editable value
    const currentBalUsd = Number(((seller.balance_cents ?? 0) / 100).toFixed(2))
    setBalanceAdjust(currentBalUsd)

    setFullName(seller.full_name ?? "")
    setEmail(seller.email ?? "")
    setPhone(seller.phone ?? "")
    setCountry((seller.country ?? "").toLowerCase())
    setRole((seller.role ?? "seller").toLowerCase())

    setPlans(
      (seller.plans ?? []).map((p) => ({
        id: Number(p.plan_id),
        name: p.title,
        priceCents: Number(p.price_cents),
      }))
    )

    setAddPlanId("")
    setAddPlanPriceUsd("")
  }, [open, seller])

  const currentBalanceDollars = useMemo(() => {
    const dollars = (Number(seller.balance_cents ?? 0) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return dollars
  }, [seller.balance_cents])

  const displayName = fullName || seller.username

  const addablePlans = useMemo(() => {
    const assigned = new Set(plans.map((p) => p.id))
    const all = plansList ?? []
    return all.filter((p) => p.is_active && !assigned.has(p.id))
  }, [plans, plansList])

  function adjustPrice(planId: number, deltaDollars: number) {
    const deltaCents = dollarsToCents(deltaDollars)
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, priceCents: Math.max(0, p.priceCents + deltaCents) }
          : p
      )
    )
  }

  function setPriceFromInput(planId: number, dollarsStr: string) {
    const cents = dollarsStringToCents(dollarsStr)
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, priceCents: cents } : p)))
  }

  function removePlan(planId: number) {
    setPlans((prev) => prev.filter((p) => p.id !== planId))
  }

  function handleAddPlan() {
    const pid = Number(addPlanId)
    if (!Number.isFinite(pid) || pid <= 0) return

    const chosen = addablePlans.find((p) => p.id === pid)
    if (!chosen) return

    const priceCents = dollarsStringToCents(addPlanPriceUsd || "0")

    setPlans((prev) => [
      ...prev,
      {
        id: pid,
        name: chosen.title,
        priceCents,
      },
    ])

    setAddPlanId("")
    setAddPlanPriceUsd("")
  }

  async function handleSave() {
    if (submitted) return
    setSubmitted(true)

    try {
      // ✅ 1) Set TARGET balance (only if changed)
      const originalCents = Number(seller.balance_cents ?? 0)
      const targetCents = dollarsToCents(Number(balanceAdjust) || 0)

      if (targetCents !== originalCents) {
        await setBalanceMut.mutateAsync({
          target_balance_cents: targetCents,
          note: "Manual set balance (admin dashboard)",
        })
      }

      // ✅ 2) Patch seller (profile + full replace plans)
      const body: PatchSellerPayload = {
        full_name: fullName ?? null,
        email: email ?? null,
        phone: phone ?? null,
        country: (country ?? "").trim() ? country : null,
        role: (role ?? "seller") as any,
        plans: plans.map((p) => ({
          plan_id: Number(p.id),
          price_cents: Number(p.priceCents) || 0,
        })),
      }

      await patchSellerMut.mutateAsync(body)

      // ✅ refresh sellers list
      await qc.invalidateQueries({ queryKey: ["admin", "sellers"] })

      setSubmitted(false)
      onOpenChange(false)
    } catch (e: any) {
      console.error(e)
      setSubmitted(false)
      alert(e?.message ?? "Something went wrong")
    }
  }

  const countryValue = country || "custom"
  const roleValue = role || "seller"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Update User
          </DialogTitle>
          <DialogDescription>
            Edit profile and assigned plans for {displayName}
          </DialogDescription>
        </DialogHeader>

        {/* User Profile Section */}
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">User Profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Username</Label>
              <Input value={seller.username} className="bg-card" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-card" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Role</Label>
              <Select value={roleValue} onValueChange={setRole}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Country</Label>
              <Select value={countryValue} onValueChange={(v) => setCountry(v === "custom" ? "" : v)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sa">Saudi Arabia</SelectItem>
                  <SelectItem value="ae">UAE</SelectItem>
                  <SelectItem value="kw">Kuwait</SelectItem>
                  <SelectItem value="bh">Bahrain</SelectItem>
                  <SelectItem value="qa">Qatar</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {countryValue === "custom" && (
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toLowerCase())}
                  className="bg-card mt-2"
                  placeholder="e.g. sa"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card" />
            </div>
          </div>

          {/* Balance Adjust */}
          <div className="mt-4 flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Balance&nbsp;
              <span className="font-semibold text-foreground">(${currentBalanceDollars})</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setBalanceAdjust((v) => Number((v - 10).toFixed(2)))}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease balance</span>
              </Button>
              <Input
                type="number"
                value={balanceAdjust}
                onChange={(e) => setBalanceAdjust(Number(e.target.value))}
                className="bg-card text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setBalanceAdjust((v) => Number((v + 10).toFixed(2)))}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase balance</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Assigned Plans Section */}
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Assigned Plans</h3>

          {plans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No plans assigned</p>
          ) : (
            <>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-10 text-xs text-muted-foreground">No</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">Price</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan, i) => (
                      <TableRow key={plan.id} className="border-border">
                        <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium text-foreground">{plan.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustPrice(plan.id, -5)}>
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Decrease price</span>
                            </Button>

                            <Input
                              className="h-7 w-24 bg-card text-right"
                              inputMode="decimal"
                              value={centsToDollarsString(plan.priceCents)}
                              onChange={(e) => setPriceFromInput(plan.id, e.target.value)}
                            />

                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustPrice(plan.id, 5)}>
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Increase price</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removePlan(plan.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove plan</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 sm:hidden">
                {plans.map((plan, i) => (
                  <div key={plan.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {i + 1}. {plan.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustPrice(plan.id, -5)}>
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Decrease price</span>
                      </Button>

                      <Input
                        className="h-7 w-20 bg-card text-right"
                        inputMode="decimal"
                        value={centsToDollarsString(plan.priceCents)}
                        onChange={(e) => setPriceFromInput(plan.id, e.target.value)}
                      />

                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustPrice(plan.id, 5)}>
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Increase price</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removePlan(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove plan</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium text-foreground mb-2">Add Plan</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Plan</Label>
                <Select value={addPlanId} onValueChange={setAddPlanId}>
                  <SelectTrigger className="bg-card mt-1">
                    <SelectValue placeholder={addablePlans.length ? "Select plan" : "No available plans"} />
                  </SelectTrigger>
                  <SelectContent>
                    {addablePlans.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Price (USD)</Label>
                <Input
                  className="bg-card mt-1 text-right"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={addPlanPriceUsd}
                  onChange={(e) => setAddPlanPriceUsd(e.target.value)}
                />
              </div>

              <div className="sm:col-span-3">
                <Button type="button" variant="outline" className="w-full" onClick={handleAddPlan} disabled={!addPlanId}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitted}>
            {submitted ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
