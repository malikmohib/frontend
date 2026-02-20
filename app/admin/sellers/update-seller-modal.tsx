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
import { useToast } from "@/hooks/use-toast"

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

function extractDetail(err: unknown): string {
  if (!err) return "Request failed"
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message
  const anyErr = err as any
  return anyErr?.detail ?? anyErr?.message ?? "Request failed"
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
  const { toast } = useToast()

  const [plans, setPlans] = useState<PlanRow[]>([])
  const [targetBalanceUsd, setTargetBalanceUsd] = useState(0) // TARGET balance in dollars
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [role, setRole] = useState("seller")
  const [isActive, setIsActive] = useState(true)

  const [addPlanId, setAddPlanId] = useState<string>("")
  const [addPlanPriceUsd, setAddPlanPriceUsd] = useState<string>("")

  const patchSellerMut = useMutation({
    mutationFn: (body: PatchSellerPayload) => patchSeller(Number(seller.id), body),
  })

  const setBalanceMut = useMutation({
    mutationFn: (body: SetBalancePayload) => setSellerBalance(Number(seller.id), body),
  })

  const busy = submitted || patchSellerMut.isPending || setBalanceMut.isPending

  useEffect(() => {
    if (!open) return

    setSubmitted(false)
    setErrorMsg("")

    const currentBalUsd = Number(((seller.balance_cents ?? 0) / 100).toFixed(2))
    setTargetBalanceUsd(currentBalUsd)

    setFullName(seller.full_name ?? "")
    setEmail(seller.email ?? "")
    setPhone(seller.phone ?? "")
    setCountry((seller.country ?? "").toLowerCase())
    setRole((seller.role ?? "seller").toLowerCase())
    setIsActive(Boolean(seller.is_active))

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
    return ((Number(seller.balance_cents ?? 0) / 100) as number).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
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
        p.id === planId ? { ...p, priceCents: Math.max(0, p.priceCents + deltaCents) } : p
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
      { id: pid, name: chosen.title, priceCents },
    ])

    setAddPlanId("")
    setAddPlanPriceUsd("")
  }

  async function handleSave() {
    if (busy) return
    setSubmitted(true)
    setErrorMsg("")

    try {
      // 1) Set TARGET balance (only if changed)
      const originalCents = Number(seller.balance_cents ?? 0)
      const targetCents = dollarsToCents(Number(targetBalanceUsd) || 0)

      if (targetCents !== originalCents) {
        await setBalanceMut.mutateAsync({
          target_balance_cents: targetCents,
          note: "Manual set balance (admin dashboard)",
        })
      }

      // 2) Patch seller (profile + full replace plans)
      const body: PatchSellerPayload = {
        full_name: fullName.trim() ? fullName.trim() : null,
        email: email.trim() ? email.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
        country: country.trim() ? country.trim().toLowerCase() : null,
        role: (role ?? "seller") as any,
        is_active: Boolean(isActive),
        plans: plans.map((p) => ({
          plan_id: Number(p.id),
          price_cents: Number(p.priceCents) || 0,
        })),
      }

      await patchSellerMut.mutateAsync(body)

      await qc.invalidateQueries({ queryKey: ["admin", "sellers"] })
      await qc.invalidateQueries({ queryKey: ["admin", "users", "tree"] })
      await qc.invalidateQueries({ queryKey: ["admin-plans"] })

      toast({
        title: "Seller updated",
        description: `@${seller.username} saved successfully.`,
      })

      setSubmitted(false)
      onOpenChange(false)
    } catch (e) {
      const msg = extractDetail(e)
      setErrorMsg(msg)
      toast({ title: "Update failed", description: msg })
      setSubmitted(false)
    }
  }

  const countryValue = country || "custom"
  const roleValue = role || "seller"

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Update Seller
          </DialogTitle>
          <DialogDescription>
            Edit profile, status, balance, and assigned plans for {displayName}.
          </DialogDescription>
        </DialogHeader>

        {/* User Profile Section */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Profile</h3>
          <p className="text-xs text-muted-foreground">Account details and access.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Username</Label>
              <Input value={seller.username} className="bg-background" disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Role</Label>
              <Select value={roleValue} onValueChange={setRole}>
                <SelectTrigger className="bg-background">
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
              <Select
                value={countryValue}
                onValueChange={(v) => setCountry(v === "custom" ? "" : v)}
              >
                <SelectTrigger className="bg-background">
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
                  className="bg-background mt-2"
                  placeholder="e.g. sa"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(v) => setIsActive(v === "active")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Balance Adjust */}
          <div className="mt-5 flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Balance&nbsp;
              <span className="font-semibold text-foreground">(${currentBalanceDollars})</span>
              <span className="ml-2 text-xs text-muted-foreground">(target)</span>
            </Label>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={busy}
                onClick={() => setTargetBalanceUsd((v) => Number((v - 10).toFixed(2)))}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease balance</span>
              </Button>

              <Input
                type="number"
                value={targetBalanceUsd}
                onChange={(e) => setTargetBalanceUsd(Number(e.target.value))}
                className="bg-background text-center tabular-nums"
                disabled={busy}
              />

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={busy}
                onClick={() => setTargetBalanceUsd((v) => Number((v + 10).toFixed(2)))}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase balance</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Assigned Plans Section */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Assigned Plans</h3>
          <p className="text-xs text-muted-foreground">
            Adjust plan pricing or add/remove plans.
          </p>

          {plans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No plans assigned</p>
          ) : (
            <>
              <div className="hidden sm:block mt-4">
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
                        <TableCell className="text-sm font-medium text-foreground">
                          {plan.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={busy}
                              onClick={() => adjustPrice(plan.id, -5)}
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Decrease price</span>
                            </Button>

                            <Input
                              className="h-7 w-24 bg-background text-right tabular-nums"
                              inputMode="decimal"
                              disabled={busy}
                              value={centsToDollarsString(plan.priceCents)}
                              onChange={(e) => setPriceFromInput(plan.id, e.target.value)}
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={busy}
                              onClick={() => adjustPrice(plan.id, 5)}
                            >
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
                            disabled={busy}
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

              <div className="flex flex-col gap-2 sm:hidden mt-4">
                {plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {i + 1}. {plan.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={busy}
                        onClick={() => adjustPrice(plan.id, -5)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <Input
                        className="h-7 w-20 bg-background text-right tabular-nums"
                        inputMode="decimal"
                        disabled={busy}
                        value={centsToDollarsString(plan.priceCents)}
                        onChange={(e) => setPriceFromInput(plan.id, e.target.value)}
                      />

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={busy}
                        onClick={() => adjustPrice(plan.id, 5)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => removePlan(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <p className="text-sm font-medium text-foreground mb-2">Add Plan</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Plan</Label>
                <Select value={addPlanId} onValueChange={setAddPlanId} disabled={busy}>
                  <SelectTrigger className="bg-background mt-1">
                    <SelectValue
                      placeholder={addablePlans.length ? "Select plan" : "No available plans"}
                    />
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
                  className="bg-background mt-1 text-right tabular-nums"
                  placeholder="0.00"
                  inputMode="decimal"
                  disabled={busy}
                  value={addPlanPriceUsd}
                  onChange={(e) => setAddPlanPriceUsd(e.target.value)}
                />
              </div>

              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddPlan}
                  disabled={busy || !addPlanId}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}