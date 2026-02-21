"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  useSellerUpdateUser,
  type SellerChildUser,
  type SellerUpdateChildInput,
} from "@/lib/api/seller/users"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: SellerChildUser | null
}

export function UpdateUserModal({ open, onOpenChange, user }: Props) {
  const { toast } = useToast()
  const updateMut = useSellerUpdateUser()

  const [role, setRole] = React.useState<"agent" | "seller">("agent")
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (!user) return
    setRole((user.role as any) === "seller" ? "seller" : "agent")
    setFullName(user.full_name ?? "")
    setEmail(user.email ?? "")
    setPhone(user.phone ?? "")
    setCountry(user.country ?? "")
    setIsActive(Boolean(user.is_active))
  }, [user])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const body: SellerUpdateChildInput = {
      role,
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      country: country.trim() || null,
      is_active: isActive,
    }

    try {
      await updateMut.mutateAsync({ id: user.id, body })
      toast({ title: "User updated" })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
        </DialogHeader>

        {!user ? (
          <div className="text-sm text-muted-foreground">No user selected.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username} disabled />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2 sm:col-span-2">
                <Checkbox
                  id="activeUpdate"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                />
                <Label htmlFor="activeUpdate">Active</Label>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={updateMut.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}