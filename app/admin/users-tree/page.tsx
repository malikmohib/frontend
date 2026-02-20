"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
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
import { useAdminUsersTreeWithBalance } from "@/lib/api/admin/users-tree-with-balance"
import { cn } from "@/lib/utils"

function formatUsdFromCents(amountCents: number) {
  const sign = amountCents < 0 ? "-" : ""
  const abs = Math.abs(amountCents)
  const dollars = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}$${dollars.toString()}.${cents.toString().padStart(2, "0")}`
}

type NodeItem = {
  id: number
  username: string
  full_name: string | null
  role: string
  parent_id: number | null
  depth: number
  is_active: boolean
  balance_cents: number
  currency: string
}

function buildChildrenMap(items: NodeItem[]) {
  const map = new Map<number | null, NodeItem[]>()
  for (const it of items) {
    const key = it.parent_id ?? null
    const arr = map.get(key) ?? []
    arr.push(it)
    map.set(key, arr)
  }
  // stable order: by username
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => a.username.localeCompare(b.username))
    map.set(k, arr)
  }
  return map
}

function hasDescendant(childrenMap: Map<number | null, NodeItem[]>, id: number) {
  const kids = childrenMap.get(id)
  return Boolean(kids && kids.length > 0)
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig")
  const parts = text.split(re)

  return (
    <>
      {parts.map((p, idx) => {
        const isMatch = p.toLowerCase() === q.toLowerCase()
        if (!isMatch) return <React.Fragment key={idx}>{p}</React.Fragment>
        return (
          <mark
            key={idx}
            className="rounded bg-primary/15 px-1 py-0.5 text-primary"
          >
            {p}
          </mark>
        )
      })}
    </>
  )
}

export default function UsersTreePage() {
  const q = useAdminUsersTreeWithBalance()
  const items = (q.data?.items ?? []) as NodeItem[]

  const [search, setSearch] = React.useState("")
  const [expanded, setExpanded] = React.useState<Set<number>>(() => new Set())

  const childrenMap = React.useMemo(() => buildChildrenMap(items), [items])

  // Find “roots” = users whose parent_id is null OR parent is not in this list (safety)
  const roots = React.useMemo(() => {
    const ids = new Set(items.map((x) => x.id))
    const rootList = items.filter(
      (x) => x.parent_id === null || !ids.has(x.parent_id)
    )
    rootList.sort((a, b) => a.username.localeCompare(b.username))
    return rootList
  }, [items])

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    const next = new Set<number>()
    for (const u of items) {
      if (hasDescendant(childrenMap, u.id)) next.add(u.id)
    }
    setExpanded(next)
  }

  function collapseAll() {
    setExpanded(new Set())
  }

  // When searching: auto-expand all ancestors of matches and show only matching branches.
  const filteredVisible = React.useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return null // “normal mode”

    const byId = new Map(items.map((x) => [x.id, x]))
    const matches = items.filter((u) => {
      return (
        u.username.toLowerCase().includes(s) ||
        (u.full_name ?? "").toLowerCase().includes(s)
      )
    })

    const keepIds = new Set<number>()
    for (const m of matches) {
      keepIds.add(m.id)
      // include ancestors chain so branch is visible
      let cur = m
      while (cur.parent_id != null) {
        const p = byId.get(cur.parent_id)
        if (!p) break
        keepIds.add(p.id)
        cur = p
      }
    }

    return {
      keepIds,
      matchesCount: matches.length,
    }
  }, [items, search])

  // auto-expand ancestors for search
  React.useEffect(() => {
    if (!filteredVisible) return
    const byId = new Map(items.map((x) => [x.id, x]))
    const next = new Set<number>()

    for (const id of filteredVisible.keepIds) {
      const node = byId.get(id)
      if (!node) continue
      if (hasDescendant(childrenMap, node.id)) next.add(node.id)
    }

    setExpanded(next)
  }, [filteredVisible, items, childrenMap])

  function renderNode(node: NodeItem, level: number, out: React.ReactNode[]) {
    // Search mode: hide nodes not in keep set
    if (filteredVisible && !filteredVisible.keepIds.has(node.id)) return

    const children = childrenMap.get(node.id) ?? []
    const canExpand = children.length > 0
    const isOpen = expanded.has(node.id)

    out.push(
      <TableRow
        key={node.id}
        className="border-border transition-colors hover:bg-secondary/50"
      >
        <TableCell className="text-sm text-foreground">
          <div className="flex items-center gap-2">
            {/* indent */}
            <span style={{ width: `${level * 16}px` }} />

            {/* expand button */}
            {canExpand ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className={cn(
                  "h-7 w-7 inline-flex items-center justify-center rounded-md",
                  "hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "transition-colors"
                )}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                <span
                  className={cn(
                    "transition-transform duration-200",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            ) : (
              <span className="h-7 w-7" />
            )}

            <span className="font-medium">
              {highlight(node.username, search)}
            </span>

            {node.full_name && (
              <span className="text-xs text-muted-foreground">
                ({highlight(node.full_name, search)})
              </span>
            )}
          </div>
        </TableCell>

        <TableCell className="text-sm text-foreground">{node.role}</TableCell>

        <TableCell
          className={cn(
            "text-sm",
            node.is_active ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {node.is_active ? "Yes" : "No"}
        </TableCell>

        <TableCell className="text-sm text-foreground text-right tabular-nums">
          {formatUsdFromCents(node.balance_cents)} {node.currency}
        </TableCell>
      </TableRow>
    )

    if (canExpand && isOpen) {
      for (const child of children) renderNode(child, level + 1, out)
    }
  }

  const rows = React.useMemo(() => {
    const out: React.ReactNode[] = []
    for (const r of roots) renderNode(r, 0, out)
    return out
  }, [roots, childrenMap, expanded, filteredVisible, search]) // include search for highlighting

  const totalLabel = React.useMemo(() => {
    if (q.isLoading) return "Loading…"
    if (filteredVisible) return `Matches: ${filteredVisible.matchesCount}`
    return `Total: ${items.length}`
  }, [q.isLoading, filteredVisible, items.length])

  const actionsDisabled = q.isLoading || q.isError || items.length === 0

  return (
    <PageShell title="Users Tree" subtitle="Expand sellers to see their children">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 bg-background"
                placeholder="Search seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={expandAll}
                disabled={actionsDisabled || Boolean(filteredVisible)}
                title={filteredVisible ? "Disabled during search" : "Expand all"}
              >
                Expand all
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={collapseAll}
                disabled={actionsDisabled || Boolean(filteredVisible)}
                title={filteredVisible ? "Disabled during search" : "Collapse all"}
              >
                Collapse
              </Button>

              <div className="ml-2 text-xs text-muted-foreground">{totalLabel}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Seller</TableHead>
                <TableHead className="text-xs text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs text-muted-foreground">Active</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">
                  Balance
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {q.isLoading && (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {q.isError && (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-destructive">
                    Failed to load users tree.
                  </TableCell>
                </TableRow>
              )}

              {!q.isLoading && !q.isError && rows.length === 0 && (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}

              {rows}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PageShell>
  )
}
