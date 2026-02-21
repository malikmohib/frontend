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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Minus, Plus, Trash2 } from "lucide-react"
import type { SellerManagedSeller } from "@/lib/api/seller/users-management"
import { useSellerAvailablePlans } from "@/lib/api/seller/plans"
import { apiFetch } from "@/lib/api/http"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

type PlanRow = {
  id: number
  name: string
  priceCents: number
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

type PatchPayload = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
  is_active?: boolean
  plans?: Array<{ plan_id: number; price_cents: number }>
}

type SetBalancePayload = {
  target_balance_cents: number
  note?: string
}

async function patchChildSeller(childId: number, body: PatchPayload) {
  return apiFetch(`/sellers/users/${childId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

async function setChildBalance(childId: number, body: SetBalancePayload) {
  return apiFetch(`/sellers/users/${childId}/balance`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function UpdateChildSellerModal({
  open,
  onOpenChange,
  seller,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: SellerManagedSeller
}) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { data: availablePlans = [] } = useSellerAvailablePlans()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [isActive, setIsActive] = useState(true)

  const [plans, setPlans] = useState<PlanRow[]>([])
  const [balanceUsd, setBalanceUsd] = useState(centsToDollarsString(seller.balance_cents))
  const [balanceNote, setBalanceNote] = useState("")

  useEffect(() => {
    setFullName(seller.full_name ?? "")
    setEmail(seller.email ?? "")
    setPhone(seller.phone ?? "")
    setCountry(seller.country ?? "")
    setIsActive(Boolean(seller.is_active))
    setBalanceUsd(centsToDollarsString(seller.balance_cents))

    setPlans(
      (seller.plans ?? []).map((p) => ({
        id: p.plan_id,
        name: p.title,
        priceCents: p.price_cents,
      }))
    )
  }, [seller])

  const availableById = useMemo(() => {
    const m = new Map<number, { title: string }>()
    for (const p of availablePlans) m.set(p.id, { title: p.title })
    return m
  }, [availablePlans])

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: PatchPayload = {
        full_name: fullName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        country: country.trim() || null,
        is_active: isActive,
        plans: plans.map((p) => ({ plan_id: p.id, price_cents: p.priceCents })),
      }
      return patchChildSeller(seller.id, body)
    },
    onSuccess: async () => {
      toast({ title: "Saved" })
      await qc.invalidateQueries({ queryKey: ["seller", "managed-sellers"] })
      onOpenChange(false)
    },
    onError: (e) => toast({ title: "Save failed", description: extractDetail(e), variant: "destructive" }),
  })

  const balanceMut = useMutation({
    mutationFn: async () => {
      const cents = dollarsStringToCents(balanceUsd)
      return setChildBalance(seller.id, {
        target_balance_cents: cents,
        note: balanceNote.trim() || undefined,
      })
    },
    onSuccess: async () => {
      toast({ title: "Balance updated" })
      await qc.invalidateQueries({ queryKey: ["seller", "managed-sellers"] })
    },
    onError: (e) =>
      toast({ title: "Balance update failed", description: extractDetail(e), variant: "destructive" }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>Edit Seller</DialogTitle>
          <DialogDescription>
            You can assign only plans you own. Child plan price must be ≥ your plan price (validated server-side).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={seller.username} disabled />
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

          <div className="space-y-2 sm:col-span-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Plans</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                // add first available plan not already in list
                const existing = new Set(plans.map((p) => p.id))
                const next = availablePlans.find((p) => p.is_active && !existing.has(p.id))
                if (!next) return
                setPlans((prev) => [
                  ...prev,
                  { id: next.id, name: next.title, priceCents: 0 },
                ])
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add plan
            </Button>
          </div>

          <div className="mt-3 overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="w-[180px] text-right">Price (USD)</TableHead>
                  <TableHead className="w-[60px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                      No plans assigned.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {availableById.get(p.id)?.title ?? p.name ?? `Plan #${p.id}`}
                        </div>
                        <div className="text-xs text-muted-foreground">plan_id: {p.id}</div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Input
                          className="ml-auto w-[160px] text-right"
                          value={centsToDollarsString(p.priceCents)}
                          onChange={(e) => {
                            const cents = dollarsStringToCents(e.target.value)
                            setPlans((prev) =>
                              prev.map((x) => (x.id === p.id ? { ...x, priceCents: cents } : x))
                            )
                          }}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPlans((prev) => prev.filter((x) => x.id !== p.id))}
                          aria-label="Remove plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <div className="text-sm font-medium">Set Balance</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Target Balance (USD)</Label>
              <Input value={balanceUsd} onChange={(e) => setBalanceUsd(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Note</Label>
              <Input value={balanceNote} onChange={(e) => setBalanceNote(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => balanceMut.mutate()}
              disabled={balanceMut.isPending}
            >
              {balanceMut.isPending ? "Updating…" : "Update Balance"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saveMut.isPending}>
            Cancel
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}