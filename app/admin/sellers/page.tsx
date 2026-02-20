"use client"

import { useMemo, useState } from "react"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { CreateSellerModal } from "./create-seller-modal"
import { UpdateSellerModal } from "./update-seller-modal"
import { useAdminSellers, type AdminSeller } from "@/lib/api/admin/sellers"
import { apiFetch } from "@/lib/api/http"
import { useMutation, useQueryClient } from "@tanstack/react-query"

function RoleBadge({ role }: { role: string }) {
  const variant =
    role === "admin" ? "default" : role === "seller" ? "secondary" : "outline"
  return (
    <Badge variant={variant} className="text-[10px]">
      {role}
    </Badge>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10)
}

function formatUsdFromCents(cents: number) {
  const dollars = cents / 100
  return dollars.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type DeleteSellerPayload = {
  note?: string
}

async function deleteSeller(sellerId: number, body: DeleteSellerPayload) {
  return apiFetch(`/admin/sellers/${sellerId}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  })
}

export default function SellersPage() {
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<AdminSeller | null>(null)

  const { data, isLoading, isError, error } = useAdminSellers()
  const qc = useQueryClient()

  const sellers = data?.items ?? []

  const deleteMut = useMutation({
    mutationFn: ({ sellerId }: { sellerId: number }) =>
      deleteSeller(sellerId, {
        note: "Return balance to parent (delete user)",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "sellers"] })
    },
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return sellers.filter((s) => {
      const created = formatDate(s.created_at)
      const name = (s.full_name ?? "").toLowerCase()
      const email = (s.email ?? "").toLowerCase()

      const matchesSearch =
        !q ||
        s.username.toLowerCase().includes(q) ||
        name.includes(q) ||
        email.includes(q)

      const matchesDate = !dateFilter || created === dateFilter
      return matchesSearch && matchesDate
    })
  }, [sellers, search, dateFilter])

  async function handleDelete(seller: AdminSeller) {
    const ok = window.confirm(
      `Delete seller "${seller.username}"?\n\nIf seller has balance, it will return to parent.`
    )
    if (!ok) return

    try {
      await deleteMut.mutateAsync({ sellerId: Number(seller.id) })
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "Failed to delete seller")
    }
  }

  return (
    <PageShell
      title="Sellers"
      subtitle="Manage seller accounts and permissions"
      actions={
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Seller
        </Button>
      }
    >
      {/* Filters */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search username, name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-40 bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Load/Error */}
      {isLoading && <p className="text-xs text-muted-foreground">Loading sellers…</p>}
      {isError && (
        <p className="text-xs text-destructive">
          Failed to load sellers: {(error as Error)?.message ?? "Unknown error"}
        </p>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Username</TableHead>
                <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Balance</TableHead>
                <TableHead className="text-xs text-muted-foreground">Parent</TableHead>
                <TableHead className="text-xs text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((seller) => (
                <TableRow key={seller.id} className="border-border">
                  <TableCell className="text-sm font-medium text-foreground">
                    {seller.username}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {seller.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={seller.role} />
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground text-right">
                    ${formatUsdFromCents(seller.balance_cents)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {seller.parent_username ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(seller.created_at)}
                  </TableCell>

                  {/* ✅ Actions: Edit + Delete side-by-side */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-primary hover:text-primary"
                        onClick={() => setEditSeller(seller)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(seller)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                        {deleteMut.isPending ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && filtered.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-sm text-muted-foreground py-8 text-center">
                    No sellers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((seller) => (
          <Card key={seller.id} className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">
                      {(seller.full_name ?? seller.username).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {seller.full_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">@{seller.username}</p>
                  </div>
                </div>
                <RoleBadge role={seller.role} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-right font-medium text-foreground">
                  ${formatUsdFromCents(seller.balance_cents)}
                </span>
                <span className="text-muted-foreground">Parent</span>
                <span className="text-right text-foreground">
                  {seller.parent_username ?? "—"}
                </span>
                <span className="text-muted-foreground">Created</span>
                <span className="text-right text-foreground">
                  {formatDate(seller.created_at)}
                </span>
              </div>

              {/* ✅ Mobile actions: Edit then Delete */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => setEditSeller(seller)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => handleDelete(seller)}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                  {deleteMut.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && filtered.length === 0 && (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">No sellers found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination (UI only) */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing 1-{filtered.length} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            1
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateSellerModal open={createOpen} onOpenChange={setCreateOpen} />
      {editSeller && (
        <UpdateSellerModal
          open={!!editSeller}
          onOpenChange={(open) => !open && setEditSeller(null)}
          seller={editSeller}
        />
      )}
    </PageShell>
  )
}
