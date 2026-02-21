"use client"

import { useMemo, useState } from "react"
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
import { Check } from "lucide-react"
import { apiFetch } from "@/lib/api/http"
import { useQueryClient } from "@tanstack/react-query"
import { useSellerAvailablePlans } from "@/lib/api/seller/plans"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Props {
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

function isEmailLike(v: string) {
  const s = v.trim()
  // simple, non-opinionated check (backend can be stricter if needed)
  return s.includes("@") && s.includes(".") && s.length >= 5
}

export function CreateChildSellerModal({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: plans = [], isLoading: plansLoading } = useSellerAvailablePlans()

  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [isActive, setIsActive] = useState(true)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([])
  const [planPricesUsd, setPlanPricesUsd] = useState<Record<number, string>>({})

  const activePlans = useMemo(() => plans.filter((p) => p.is_active), [plans])

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const plansValid = useMemo(() => {
    for (const pid of selectedPlanIds) {
      const v = planPricesUsd[pid]
      if (!v) return false
      const cents = dollarsToCents(v)
      if (cents <= 0) return false
    }
    return true
  }, [selectedPlanIds, planPricesUsd])

  const requiredValid = useMemo(() => {
    const u = username.trim()
    const fn = fullName.trim()
    const em = email.trim()
    const ph = phone.trim()
    const co = country.trim()

    if (!u) return false
    if (!password) return false
    if (passwordMismatch) return false

    if (!fn) return false
    if (!em || !isEmailLike(em)) return false
    if (!ph) return false
    if (!co) return false

    if (selectedPlanIds.length > 0 && !plansValid) return false
    return true
  }, [
    username,
    password,
    passwordMismatch,
    fullName,
    email,
    phone,
    country,
    selectedPlanIds.length,
    plansValid,
  ])

  function reset() {
    setSubmitted(false)
    setErrorMsg("")
    setUsername("")
    setFullName("")
    setEmail("")
    setPhone("")
    setCountry("")
    setIsActive(true)
    setPassword("")
    setConfirmPassword("")
    setSelectedPlanIds([])
    setPlanPricesUsd({})
  }

  async function onSubmit() {
    setSubmitted(true)
    setErrorMsg("")

    if (!requiredValid) return

    try {
      const payload = {
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        is_active: isActive,
        plans: selectedPlanIds.map((pid) => ({
          plan_id: pid,
          price_cents: dollarsToCents(planPricesUsd[pid] || "0"),
        })),
      }

      await apiFetch(`/sellers/users`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      toast({ title: "Seller created" })
      await qc.invalidateQueries({ queryKey: ["seller", "managed-sellers"] })
      onOpenChange(false)
      reset()
    } catch (err) {
      setErrorMsg(extractDetail(err))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Create Seller</DialogTitle>
          <DialogDescription>
            Role is always <b>seller</b>. You may only assign plans you already have.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            {submitted && !username.trim() && (
              <p className="text-xs text-destructive">Username is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Active</Label>
            <Button
              type="button"
              variant={isActive ? "default" : "secondary"}
              className="w-full"
              onClick={() => setIsActive((v) => !v)}
            >
              {isActive ? "Active" : "Inactive"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {submitted && !password && <p className="text-xs text-destructive">Password is required</p>}
          </div>

          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {submitted && passwordMismatch && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {submitted && !fullName.trim() && (
              <p className="text-xs text-destructive">Full name is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            {submitted && (!email.trim() || !isEmailLike(email)) && (
              <p className="text-xs text-destructive">Valid email is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            {submitted && !phone.trim() && (
              <p className="text-xs text-destructive">Phone is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            {submitted && !country.trim() && (
              <p className="text-xs text-destructive">Country is required</p>
            )}
          </div>
        </div>

        <div className="mt-2 rounded-md border border-border p-3">
          <div className="text-sm font-medium">Assign plans</div>
          <div className="text-xs text-muted-foreground">
            Prices must be <b>≥ your own price</b> (validated server-side).
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plansLoading ? (
              <div className="text-sm text-muted-foreground">Loading plans…</div>
            ) : activePlans.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No plans available to assign. Ask admin to assign plans to you.
              </div>
            ) : (
              activePlans.map((p) => {
                const checked = selectedPlanIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanIds((prev) => {
                        if (prev.includes(p.id)) return prev.filter((x) => x !== p.id)
                        return [...prev, p.id]
                      })
                      setPlanPricesUsd((prev) => ({
                        ...prev,
                        [p.id]: prev[p.id] ?? "0.00",
                      }))
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-md border border-border px-3 py-2 text-left",
                      checked ? "bg-primary/10" : "bg-background"
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                    </div>
                    {checked ? <Check className="h-4 w-4" /> : null}
                  </button>
                )
              })
            )}
          </div>

          {selectedPlanIds.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedPlanIds.map((pid) => {
                const plan = activePlans.find((x) => x.id === pid)
                if (!plan) return null
                return (
                  <div key={pid} className="grid grid-cols-3 items-center gap-2">
                    <div className="col-span-2">
                      <div className="text-sm">{plan.title}</div>
                      <div className="text-xs text-muted-foreground">{plan.category}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price (USD)</Label>
                      <Input
                        value={planPricesUsd[pid] ?? ""}
                        onChange={(e) =>
                          setPlanPricesUsd((prev) => ({ ...prev, [pid]: e.target.value }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )
              })}
              {submitted && selectedPlanIds.length > 0 && !plansValid && (
                <p className="text-xs text-destructive">All selected plans must have a price &gt; 0</p>
              )}
            </div>
          )}
        </div>

        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!requiredValid}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}