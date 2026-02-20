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

interface CreateSellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function extractDetail(err: unknown): string {
  if (!err) return "Request failed"
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message
  const anyErr = err as any
  return anyErr?.detail ?? "Request failed"
}

function dollarsToCents(v: string): number {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export function CreateSellerModal({ open, onOpenChange }: CreateSellerModalProps) {
  const qc = useQueryClient()

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

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false
    if (!password || !confirmPassword) return false
    if (passwordMismatch) return false
    if (!role.trim()) return false
    if (submitted) return false

    for (const pid of selectedPlanIds) {
      const v = planPricesUsd[pid]
      if (v == null || String(v).trim() === "") return false
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return false
    }

    return true
  }, [username, password, confirmPassword, passwordMismatch, role, submitted, selectedPlanIds, planPricesUsd])

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
    setSelectedPlanIds((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((id) => id !== planId)
      }
      return [...prev, planId]
    })

    setPlanPricesUsd((prev) => {
      const next = { ...prev }
      if (selectedPlanIds.includes(planId)) {
        delete next[planId]
      } else {
        if (next[planId] == null) next[planId] = ""
      }
      return next
    })
  }

  async function handleCreate() {
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

      full_name: fullName || null,
      email: email || null,
      phone: phone || null,
      country: country || null,

      plans: plansPayload,
    }

    try {
      await apiFetch("/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      qc.invalidateQueries({ queryKey: ["admin-plans"] })
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] })
      qc.invalidateQueries({ queryKey: ["admin", "users", "tree"] })

      setSubmitted(false)
      onOpenChange(false)
    } catch (e) {
      setErrorMsg(extractDetail(e))
      setSubmitted(false)
    }
  }

  const activePlans = useMemo(() => {
    return (plans as AdminPlan[]).filter((p) => p.is_active)
  }, [plans])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create Seller
          </DialogTitle>
          <DialogDescription>Add a new seller to the system</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Username
              </Label>
              <Input
                placeholder="e.g. john_d"
                className="bg-background"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Name
              </Label>
              <Input
                placeholder="Full name"
                className="bg-background"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Email
              </Label>
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Country
              </Label>
              <Input
                placeholder="e.g. SA"
                className="bg-background"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Role
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Password
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
                Retype Password
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
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Status
            </Label>
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

          {/* Assign Plans */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Assign Plans
              {selectedPlanIds.length > 0 && (
                <span className="ml-1.5 text-primary">
                  ({selectedPlanIds.length} selected)
                </span>
              )}
            </Label>

            <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-border bg-background p-2 sm:grid-cols-2">
              {(plansLoading ? [] : activePlans).map((plan) => {
                const isSelected = selectedPlanIds.includes(plan.id)

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => togglePlan(plan.id)}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="font-medium">{plan.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {plan.warranty_days}d
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedPlanIds.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-background p-2">
                {selectedPlanIds.map((pid) => {
                  const plan = activePlans.find((p) => p.id === pid)
                  return (
                    <div key={pid} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {plan?.title ?? `Plan #${pid}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enter price (USD)
                        </p>
                      </div>

                      <div className="w-32">
                        <Input
                          className="bg-background text-right"
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
              </div>
            )}
          </div>

          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitted}
          >
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
