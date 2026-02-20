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
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { CreateSellerModal } from "./create-seller-modal"
import { UpdateSellerModal } from "./update-seller-modal"
import { useAdminSellers, type AdminSeller } from "@/lib/api/admin/sellers"
import { apiFetch } from "@/lib/api/http"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function RoleBadge({ role }: { role: string }) {
  // More subtle & consistent than big colors
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
  const dollars = (Number(cents) || 0) / 100
  return dollars.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type DeleteSellerPayload = { note?: string }

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

  // Pagination (real)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminSeller | null>(null)

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
      await qc.invalidateQueries({ queryKey: ["admin", "users", "tree"] })
    },
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    // keep newest first (more useful)
    const sorted = [...sellers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return sorted.filter((s) => {
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

  // reset to page 1 when filters change
  useMemo(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFilter])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage])

  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync({ sellerId: Number(deleteTarget.id) })
      setDeleteTarget(null)
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
      <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
              <div className="relative flex-1 min-w-[240px]">
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

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {isLoading ? "Loading…" : `${total} seller(s)`}
              </Badge>
            </div>
          </div>

          {isError && (
            <p className="mt-3 text-xs text-destructive">
              Failed to load sellers: {(error as Error)?.message ?? "Unknown error"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
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
                {isLoading && (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Loading sellers…
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && pageItems.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No sellers found.
                    </TableCell>
                  </TableRow>
                )}

                {pageItems.map((seller, idx) => (
                  <TableRow
                    key={seller.id}
                    className="border-border transition-colors hover:bg-secondary/50 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(idx * 15, 150)}ms` }}
                  >
                    <TableCell className="text-sm font-medium text-foreground">
                      {seller.username}
                    </TableCell>

                    <TableCell className="text-sm text-foreground">
                      {seller.full_name ?? "—"}
                      {seller.email ? (
                        <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                          {seller.email}
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      <RoleBadge role={seller.role} />
                    </TableCell>

                    <TableCell className="text-sm font-medium text-foreground text-right tabular-nums">
                      ${formatUsdFromCents(seller.balance_cents)}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {seller.parent_username ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(seller.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditSeller(seller)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(seller)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {safePage} of {totalPages} • Showing{" "}
              {total === 0 ? 0 : (safePage - 1) * pageSize + 1}-
              {Math.min(safePage * pageSize, total)} of {total}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {pageItems.map((seller, idx) => (
          <Card
            key={seller.id}
            className="border-border bg-card shadow-sm transition-colors hover:bg-secondary/40 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
            style={{ animationDelay: `${Math.min(idx * 20, 160)}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {seller.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">@{seller.username}</p>
                  {seller.email ? (
                    <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                      {seller.email}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <RoleBadge role={seller.role} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditSeller(seller)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(seller)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  ${formatUsdFromCents(seller.balance_cents)}
                </span>
                <span className="text-muted-foreground">Parent</span>
                <span className="text-right text-foreground">
                  {seller.parent_username ?? "—"}
                </span>
                <span className="text-muted-foreground">Created</span>
                <span className="text-right text-foreground">{formatDate(seller.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && pageItems.length === 0 && (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">No sellers found.</p>
            </CardContent>
          </Card>
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {safePage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete seller?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.username}
              </span>
              . If the seller has a balance, it will be returned to the parent.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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