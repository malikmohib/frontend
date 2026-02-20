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
import { Check } from "lucide-react"
import { apiFetch } from "@/lib/api/http"
import { useQueryClient } from "@tanstack/react-query"
import { useAdminPlans, type AdminPlan } from "@/lib/api/admin/plans"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CreateSellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function extractDetail(err: unknown): string {
  if (!err) return "Request failed"
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message
  const anyErr = err as any
  return anyErr?.detail ?? anyErr?.message ?? "Request failed"
}

function dollarsToCents(v: string): number {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export function CreateSellerModal({ open, onOpenChange }: CreateSellerModalProps) {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: plans = [], isLoading: plansLoading } = useAdminPlans()

  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [role, setRole] = useState("seller")
  const [isActive, setIsActive] = useState(true)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([])
  const [planPricesUsd, setPlanPricesUsd] = useState<Record<number, string>>({})

  const activePlans = useMemo(() => {
    return (plans as AdminPlan[]).filter((p) => p.is_active)
  }, [plans])

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const plansValid = useMemo(() => {
    for (const pid of selectedPlanIds) {
      const v = planPricesUsd[pid]
      if (v == null || String(v).trim() === "") return false
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return false
    }
    return true
  }, [selectedPlanIds, planPricesUsd])

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false
    if (!password || !confirmPassword) return false
    if (passwordMismatch) return false
    if (!role.trim()) return false
    if (!plansValid) return false
    if (submitted) return false
    return true
  }, [username, password, confirmPassword, passwordMismatch, role, plansValid, submitted])

  function reset() {
    setSubmitted(false)
    setErrorMsg("")
    setUsername("")
    setFullName("")
    setEmail("")
    setPhone("")
    setCountry("")
    setRole("seller")
    setIsActive(true)
    setPassword("")
    setConfirmPassword("")
    setSelectedPlanIds([])
    setPlanPricesUsd({})
  }

  useEffect(() => {
    if (!open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function togglePlan(planId: number) {
    // ✅ Fix: avoid stale selectedPlanIds usage by doing everything from prev state.
    setSelectedPlanIds((prev) => {
      const isSelected = prev.includes(planId)

      setPlanPricesUsd((pricesPrev) => {
        const next = { ...pricesPrev }
        if (isSelected) {
          delete next[planId]
        } else if (next[planId] == null) {
          next[planId] = ""
        }
        return next
      })

      return isSelected ? prev.filter((id) => id !== planId) : [...prev, planId]
    })
  }

  async function handleCreate() {
    if (!canSubmit) return
    setSubmitted(true)
    setErrorMsg("")

    const plansPayload = selectedPlanIds.map((pid) => ({
      plan_id: pid,
      price_cents: dollarsToCents(planPricesUsd[pid] ?? "0"),
    }))

    const payload = {
      username: username.trim(),
      password,
      role,
      is_active: isActive,

      full_name: fullName.trim() ? fullName.trim() : null,
      email: email.trim() ? email.trim() : null,
      phone: phone.trim() ? phone.trim() : null,
      country: country.trim() ? country.trim() : null,

      plans: plansPayload,
    }

    try {
      await apiFetch("/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      await qc.invalidateQueries({ queryKey: ["admin-plans"] })
      await qc.invalidateQueries({ queryKey: ["admin", "sellers"] })
      await qc.invalidateQueries({ queryKey: ["admin", "users", "tree"] })

      toast({
        title: "Seller created",
        description: `@${payload.username} has been added successfully.`,
      })

      setSubmitted(false)
      onOpenChange(false)
    } catch (e) {
      const msg = extractDetail(e)
      setErrorMsg(msg)
      toast({ title: "Create failed", description: msg })
      setSubmitted(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={submitted ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create Seller
          </DialogTitle>
          <DialogDescription>
            Add a new seller and optionally assign plan pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Profile */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Profile</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Basic identity and access settings.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. seller_001"
                  className="bg-background"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                <Input
                  placeholder="Full name"
                  className="bg-background"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  className="bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="+966 5XX XXX XXX"
                  className="bg-background"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Country</Label>
                <Input
                  placeholder="e.g. SA"
                  className="bg-background"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          {/* Password */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Password</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Set the initial password for the account.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Retype Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Retype password"
                  className="bg-background"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {passwordMismatch && (
              <p className="mt-2 text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          {/* Assign Plans */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Assign Plans</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select plans and set seller pricing.
                </p>
              </div>

              {selectedPlanIds.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedPlanIds.length} selected
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(plansLoading ? [] : activePlans).map((plan) => {
                const isSelected = selectedPlanIds.includes(plan.id)

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => togglePlan(plan.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      "hover:bg-secondary/50",
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-background"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className={cn("font-medium", !isSelected && "text-foreground")}>
                        {plan.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plan.warranty_days}d
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedPlanIds.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-background p-3">
                {selectedPlanIds.map((pid) => {
                  const plan = activePlans.find((p) => p.id === pid)
                  return (
                    <div key={pid} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {plan?.title ?? `Plan #${pid}`}
                        </p>
                        <p className="text-xs text-muted-foreground">Price (USD)</p>
                      </div>

                      <div className="w-32">
                        <Input
                          className={cn(
                            "bg-background text-right tabular-nums",
                            planPricesUsd[pid] != null &&
                              String(planPricesUsd[pid]).trim() === "" &&
                              "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="0.00"
                          inputMode="decimal"
                          value={planPricesUsd[pid] ?? ""}
                          onChange={(e) =>
                            setPlanPricesUsd((prev) => ({
                              ...prev,
                              [pid]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )
                })}

                {!plansValid && (
                  <p className="text-xs text-destructive">
                    Please enter a valid price for all selected plans.
                  </p>
                )}
              </div>
            )}
          </div>

          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitted}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            {submitted ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}