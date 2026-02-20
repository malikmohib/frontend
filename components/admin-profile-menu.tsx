"use client"

import * as React from "react"
import { LogOut, KeyRound, User, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMe, changePassword } from "@/lib/api/admin/me"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function formatUsdFromCents(amountCents: number) {
  const sign = amountCents < 0 ? "-" : ""
  const abs = Math.abs(amountCents)
  const dollars = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}$${dollars.toString()}.${cents.toString().padStart(2, "0")}`
}

function initials(name?: string | null, username?: string | null) {
  const src = (name || "").trim()
  if (src) {
    const parts = src.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] ?? ""
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
    return (a + b).toUpperCase() || "U"
  }
  const u = (username || "").trim()
  return (u[0]?.toUpperCase() ?? "U")
}

export function AdminProfileMenu() {
  const router = useRouter()
  const meQ = useMe()

  const [open, setOpen] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  async function onLogout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    router.replace("/login")
  }

  function resetForm() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmNewPassword("")
    setError("")
  }

  async function onChangePassword() {
    setError("")

    const cur = currentPassword.trim()
    const nw = newPassword.trim()
    const cn = confirmNewPassword.trim()

    if (!cur || !nw || !cn) {
      setError("Fill current password, new password, and confirmation.")
      return
    }
    if (nw.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    if (nw !== cn) {
      setError("New password and confirmation do not match.")
      return
    }

    try {
      setSaving(true)
      await changePassword({
        current_password: cur,
        new_password: nw,
        confirm_new_password: cn,
      })
      setOpen(false)
      resetForm()
    } catch (e: any) {
      setError(e?.message ?? "Failed to change password.")
    } finally {
      setSaving(false)
    }
  }

  const displayName = meQ.data?.full_name?.trim() || meQ.data?.username || "Account"
  const username = meQ.data?.username || ""
  const role = meQ.data?.role || ""
  const balanceText = meQ.data
    ? `${formatUsdFromCents(meQ.data.balance_cents)} ${meQ.data.currency}`
    : ""

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-2">
          <DropdownMenuLabel className="p-2">
            {/* Header block */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {initials(meQ.data?.full_name, meQ.data?.username)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {meQ.isLoading ? "Loading…" : displayName}
                  </div>
                  {role ? (
                    <span className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {role}
                    </span>
                  ) : null}
                </div>

                {/* Username + Balance row */}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {username ? (
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      @{username}
                    </span>
                  ) : null}

                  {meQ.data ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      {balanceText}
                    </span>
                  ) : meQ.isLoading ? (
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                      Fetching balance…
                    </span>
                  ) : null}
                </div>

                {meQ.isError ? (
                  <div className="mt-1 text-[10px] text-destructive">
                    Failed to load profile.
                  </div>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={cn("cursor-pointer")}
            onClick={() => {
              resetForm()
              setOpen(true)
            }}
            disabled={meQ.isLoading || meQ.isError}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Change password
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Retype new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onChangePassword} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
