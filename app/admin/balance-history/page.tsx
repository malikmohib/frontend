"use client"
import { cn } from "@/lib/utils"
import * as React from "react"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Copy, Search } from "lucide-react"
import { useAdminBalanceHistory } from "@/lib/api/admin/balance-history"
import { useAdminUsersTree } from "@/lib/api/admin/users-tree"

const KIND_LABELS: Record<string, string> = {
  admin_topup: "Admin Top Up",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  purchase_debit: "Purchase Debit",
  profit_credit: "Profit Credit",
}

// Radix/shadcn SelectItem cannot have value=""
const ALL_SELLERS_VALUE = "__all__"

function formatUsdFromCents(amountCents: number) {
  const sign = amountCents < 0 ? "-" : ""
  const abs = Math.abs(amountCents)
  const dollars = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}$${dollars.toString()}.${cents.toString().padStart(2, "0")}`
}

function formatSignedUsdFromCents(amountCents: number) {
  return amountCents >= 0
    ? `+${formatUsdFromCents(amountCents)}`
    : formatUsdFromCents(amountCents)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function KindBadge({ kind }: { kind: string }) {
  const label = KIND_LABELS[kind] ?? kind

  // Subtle, professional styles (no huge colored bubbles)
  const tone =
    kind === "profit_credit" || kind === "transfer_in" || kind === "admin_topup"
      ? "positive"
      : kind === "purchase_debit" || kind === "transfer_out"
        ? "negative"
        : "neutral"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        "leading-4 whitespace-nowrap",
        "bg-background text-foreground border-border",
        tone === "positive" && "bg-emerald-50 text-emerald-700 border-emerald-200",
        tone === "negative" && "bg-rose-50 text-rose-700 border-rose-200",
        tone === "neutral" && "bg-muted text-muted-foreground border-border"
      )}
    >
      {label}
    </span>
  )
}

export default function BalanceHistoryPage() {
  // filters (UI state)
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [entryKind, setEntryKind] = React.useState<string>("all")
  const [txId, setTxId] = React.useState<string>("")

  // OPTIONAL now; default is ALL sellers
  const [username, setUsername] = React.useState<string>(ALL_SELLERS_VALUE)

  // pagination
  const [limit] = React.useState<number>(50)
  const [offset, setOffset] = React.useState<number>(0)

  // applied filters (query state)
  // username: "" means ALL sellers below me
  const [applied, setApplied] = React.useState({
    username: "",
    date_from: "",
    date_to: "",
    entry_kind: "all",
    tx_id: "",
  })

  // Load sellers dropdown options from /admin/users/tree
  const usersTreeQ = useAdminUsersTree()
  const sellerOptions = React.useMemo(() => {
    const items = usersTreeQ.data?.items ?? []
    const usernames = items
      .filter((u) => u.role === "seller" && u.is_active)
      .map((u) => u.username)

    return Array.from(new Set(usernames)).sort((a, b) => a.localeCompare(b))
  }, [usersTreeQ.data])

  const params = {
    username: applied.username || null, // null => ALL sellers below me
    date_from: applied.date_from || null,
    date_to: applied.date_to || null,
    entry_kind: applied.entry_kind === "all" ? null : applied.entry_kind,
    tx_id: applied.tx_id || null,
    limit,
    offset,
  }

  const q = useAdminBalanceHistory(params)
  const items = q.data?.items ?? []
  const canPrev = offset > 0
  const canNext = items.length === limit

  const [copiedTx, setCopiedTx] = React.useState<string | null>(null)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTx(text)
      setTimeout(() => setCopiedTx(null), 900)
    } catch {
      // ignore clipboard failures
    }
  }

  function onSearch() {
    setOffset(0)
    setApplied({
      username: username === ALL_SELLERS_VALUE ? "" : username.trim(),
      date_from: dateFrom.trim(),
      date_to: dateTo.trim(),
      entry_kind: entryKind,
      tx_id: txId.trim(),
    })
  }

  function onReset() {
    setUsername(ALL_SELLERS_VALUE)
    setDateFrom("")
    setDateTo("")
    setEntryKind("all")
    setTxId("")
    setOffset(0)
    setApplied({
      username: "",
      date_from: "",
      date_to: "",
      entry_kind: "all",
      tx_id: "",
    })
  }

  function setLast7Days() {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - 7)
    setDateFrom(toYmd(from))
    setDateTo(toYmd(now))
  }

  return (
    <PageShell title="Balance History" subtitle="All ledger entries and transactions">
      {/* Filters */}
      <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Seller dropdown */}
            <div className="w-48">
              <Select value={username} onValueChange={setUsername}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SELLERS_VALUE}>All sellers</SelectItem>

                  {usersTreeQ.isLoading && (
                    <SelectItem value="__loading" disabled>
                      Loading…
                    </SelectItem>
                  )}

                  {usersTreeQ.isError && (
                    <SelectItem value="__error" disabled>
                      Failed to load sellers
                    </SelectItem>
                  )}

                  {!usersTreeQ.isLoading &&
                    !usersTreeQ.isError &&
                    sellerOptions.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        No sellers found
                      </SelectItem>
                    )}

                  {sellerOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              type="date"
              className="w-40 bg-background"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              className="w-40 bg-background"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <Select value={entryKind} onValueChange={setEntryKind}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue placeholder="Entry Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="admin_topup">Admin Top Up</SelectItem>
                <SelectItem value="transfer_in">Transfer In</SelectItem>
                <SelectItem value="transfer_out">Transfer Out</SelectItem>
                <SelectItem value="purchase_debit">Purchase Debit</SelectItem>
                <SelectItem value="profit_credit">Profit Credit</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tx ID..."
                className="pl-9 bg-background"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="h-10" onClick={onSearch} disabled={q.isFetching}>
                Search
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10"
                onClick={onReset}
                disabled={q.isFetching}
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-10"
                onClick={setLast7Days}
                disabled={q.isFetching}
              >
                Last 7 days
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Offset: {offset} • Limit: {limit}
            </div>

            {q.isFetching && <div className="text-xs text-muted-foreground">Loading…</div>}
            {q.isError && (
              <div className="text-xs text-destructive">Failed to load wallet history.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300 ease-out motion-reduce:animate-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Ledger Entries
            </CardTitle>
          </CardHeader>

          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Kind</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Balance After
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">Tx ID</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Note</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((it: any, idx: number) => {
                  const isPositive = it.amount_cents >= 0

                  return (
                    <TableRow
                      key={it.id}
                      className="border-border transition-colors hover:bg-secondary/50 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                      style={{ animationDelay: `${Math.min(idx * 12, 180)}ms` }}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatDate(it.created_at)}
                      </TableCell>

                      <TableCell className="text-sm text-foreground">
                        {it.username ?? (applied.username || "—")}
                      </TableCell>

                      <TableCell className="text-sm text-foreground">
                        <KindBadge kind={it.entry_kind} />
                      </TableCell>

                      <TableCell
                        className={`text-sm font-semibold text-right tabular-nums ${
                          isPositive ? "text-accent" : "text-destructive"
                        }`}
                      >
                        {formatSignedUsdFromCents(it.amount_cents)}
                      </TableCell>

                      <TableCell className="text-sm text-foreground text-right tabular-nums">
                        {formatUsdFromCents(it.balance_after_cents)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/balance-history/tx/${it.tx_id}?u=${encodeURIComponent(
                              it.username ?? applied.username ?? ""
                            )}`}
                            className="text-xs font-mono text-primary hover:underline"
                          >
                            {it.tx_id}
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copy(it.tx_id)}
                            title="Copy tx id"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {copiedTx === it.tx_id && (
                            <span className="text-[10px] text-muted-foreground">
                              Copied
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                        {it.note?.trim() ? it.note : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!q.isFetching && items.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={7}
                      className="py-10 text-sm text-muted-foreground text-center"
                    >
                      No entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Offset: {offset} • Limit: {limit}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || q.isFetching}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || q.isFetching}
                onClick={() => setOffset((o) => o + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((it: any, idx: number) => {
          const isPositive = it.amount_cents >= 0

          return (
            <Link key={it.id} href={`/admin/balance-history/tx/${it.tx_id}`}>
              <Card
                className="border-border bg-card shadow-sm transition-colors hover:bg-secondary/40 animate-in fade-in duration-300 ease-out motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(idx * 18, 160)}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {it.username ?? (applied.username || "—")}
                      </div>
                      <div className="mt-1">
                        <KindBadge kind={it.entry_kind} />
                      </div>
                    </div>

                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isPositive ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {formatSignedUsdFromCents(it.amount_cents)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      After: {formatUsdFromCents(it.balance_after_cents)}
                    </span>
                    <span className="font-mono">{formatDate(it.created_at)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-primary truncate">
                      {it.tx_id}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={(e) => {
                        e.preventDefault()
                        copy(it.tx_id)
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground truncate">
                    {it.note?.trim() ? it.note : "—"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {!q.isFetching && items.length === 0 && (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground text-center">
                No entries found.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile pagination (added) */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev || q.isFetching}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext || q.isFetching}
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </PageShell>
  )
}