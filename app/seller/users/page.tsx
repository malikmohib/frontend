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
import { CreateChildSellerModal } from "./create-child-seller-modal"
import { UpdateChildSellerModal } from "./update-child-seller-modal"
import { useSellerManagedSellers, type SellerManagedSeller } from "@/lib/api/seller/users-management"
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

type DeletePayload = { note?: string }

async function deleteChildSeller(childId: number, body: DeletePayload) {
  return apiFetch(`/sellers/users/${childId}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  })
}

export default function SellerUsersPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useSellerManagedSellers()

  const items = data?.items ?? []

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<SellerManagedSeller | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SellerManagedSeller | null>(null)

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter((u) => {
      const name = (u.full_name ?? "").toLowerCase()
      const email = (u.email ?? "").toLowerCase()
      return u.username.toLowerCase().includes(s) || name.includes(s) || email.includes(s)
    })
  }, [items, search])

  const [page, setPage] = useState(1)
  const pageSize = 10

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const delMut = useMutation({
    mutationFn: async (seller: SellerManagedSeller) => {
      return deleteChildSeller(seller.id, { note: "Return balance to parent (delete user)" })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["seller", "managed-sellers"] })
    },
  })

  return (
    <PageShell
      title="Users"
      subtitle="Manage your direct child sellers (no grandchildren access)"
      actions={
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Seller
        </Button>
      }
    >
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search username, name, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9 bg-background"
              />
            </div>

            <Badge variant="secondary" className="text-[10px]">
              {isLoading ? "Loading…" : `${filtered.length} user(s)`}
            </Badge>
          </div>

          {isError && (
            <p className="mt-3 text-xs text-destructive">
              Failed to load users: {(error as Error)?.message ?? "Unknown error"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Username</TableHead>
                <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground">Active</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Balance</TableHead>
                <TableHead className="text-xs text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading users…
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && paged.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                paged.map((u) => (
                  <TableRow key={u.id} className="border-border transition-colors hover:bg-secondary/50">
                    <TableCell className="text-sm font-medium text-foreground">{u.username}</TableCell>
                    <TableCell className="text-sm text-foreground">{u.full_name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-foreground">{u.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-sm text-foreground text-right">
                      ${formatUsdFromCents(u.balance_cents)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{formatDate(u.created_at)}</TableCell>

                    <TableCell className="text-sm text-foreground text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="More">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditSeller(u)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget(u)
                              setDeleteOpen(true)
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
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

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <CreateChildSellerModal open={createOpen} onOpenChange={setCreateOpen} />

      {editSeller && (
        <UpdateChildSellerModal
          open={Boolean(editSeller)}
          onOpenChange={(v) => {
            if (!v) setEditSeller(null)
          }}
          seller={editSeller}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete seller?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the seller and return their remaining balance to you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={delMut.isPending || !deleteTarget}
              onClick={async () => {
                if (!deleteTarget) return
                await delMut.mutateAsync(deleteTarget)
                setDeleteOpen(false)
                setDeleteTarget(null)
              }}
            >
              {delMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}