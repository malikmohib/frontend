"use client"

import { useMemo, useState } from "react"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Wallet, Building2, Users } from "lucide-react"
import {
  getDefaultAdminHistoryUsername,
  useAdminWalletBalance,
  useAdminWalletHistory,
  useAdminWalletTopup,
} from "@/lib/api/admin/wallet"

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function WalletPage() {
  const balanceQ = useAdminWalletBalance()
  const topupM = useAdminWalletTopup()

  const [historyUsername, setHistoryUsername] = useState<string>(
    getDefaultAdminHistoryUsername() ?? ""
  )

  const historyQ = useAdminWalletHistory({
    username: historyUsername,
    limit: 50,
    offset: 0,
  })

  const [topupUserId, setTopupUserId] = useState<string>("")
  const [topupAmountUsd, setTopupAmountUsd] = useState<string>("")
  const [topupNote, setTopupNote] = useState<string>("")

  const adminBalanceCents = (balanceQ.data as any)?.balance_cents ?? 0

  const balances = useMemo(() => {
    return [
      { label: "Total System Balance", value: "—", icon: Wallet }, // not provided by API
      { label: "Admin Balance", value: formatMoneyFromCents(adminBalanceCents), icon: Building2 },
      { label: "Sellers Total", value: "—", icon: Users }, // not provided by API
    ]
  }, [adminBalanceCents])

  const ledgerItems: any[] = Array.isArray((historyQ.data as any)?.items)
    ? ((historyQ.data as any).items as any[])
    : []

  async function onTopup() {
    const user_id = Number(topupUserId)
    if (!Number.isFinite(user_id) || user_id <= 0) {
      alert("Enter a valid User ID")
      return
    }

    const usd = Number(topupAmountUsd)
    if (!Number.isFinite(usd) || usd <= 0) {
      alert("Enter a valid amount in USD (e.g. 50)")
      return
    }

    const amount_cents = Math.round(usd * 100)

    await topupM.mutateAsync({
      user_id,
      amount_cents,
      note: topupNote.trim() ? topupNote.trim() : null,
    })

    setTopupAmountUsd("")
    setTopupNote("")
  }

  return (
    <PageShell title="Wallet" subtitle="Balances overview and management">
      {/* Balance Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {balances.map((b) => (
          <Card key={b.label} className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <b.icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {balanceQ.isLoading ? "…" : b.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{b.label}</p>
              {balanceQ.error ? (
                <p className="mt-2 text-xs text-red-600">
                  {(balanceQ.error as any)?.message ?? "Failed to load balance"}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Forms */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">
              Admin Top Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <Input
                  placeholder="e.g. 2"
                  type="number"
                  className="mt-1 bg-background"
                  value={topupUserId}
                  onChange={(e) => setTopupUserId(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
                <Input
                  placeholder="e.g. 50"
                  type="number"
                  className="mt-1 bg-background"
                  value={topupAmountUsd}
                  onChange={(e) => setTopupAmountUsd(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Note</Label>
                <Input
                  placeholder="e.g. Monthly top-up"
                  className="mt-1 bg-background"
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                />
              </div>

              <Button size="sm" className="w-full" onClick={onTopup} disabled={topupM.isPending}>
                {topupM.isPending ? "Topping up…" : "Top Up"}
              </Button>

              {topupM.error ? (
                <p className="text-xs text-red-600">
                  {(topupM.error as any)?.message ?? "Top up failed"}
                </p>
              ) : null}

              {topupM.isSuccess ? (
                <p className="text-xs text-accent">Top up successful.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">
              Adjust Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <Input placeholder="e.g. seller_sara" className="mt-1 bg-background" disabled />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input placeholder="e.g. -50 or +100" className="mt-1 bg-background" disabled />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <Input placeholder="e.g. correction" className="mt-1 bg-background" disabled />
              </div>
              <Button size="sm" className="w-full" disabled title="No admin adjust endpoint in Swagger">
                Adjust
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Adjustment isn’t wired yet (no endpoint in Swagger). If you add one, we’ll connect it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            Recent Ledger Entries
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">History Username (required by API)</Label>
            <Input
              className="mt-1 bg-background"
              placeholder="e.g. admin"
              value={historyUsername}
              onChange={(e) => setHistoryUsername(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              This endpoint requires <span className="font-mono">username</span>.
              We can auto-fill it once your login stores username in localStorage.
            </p>
          </div>

          {historyQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading history…</div>
          ) : historyQ.error ? (
            <div className="text-sm text-red-600">
              {(historyQ.error as any)?.message ?? "Failed to load history"}
            </div>
          ) : null}
        </CardContent>

        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Kind</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Balance After</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Tx ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerItems.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No ledger entries.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerItems.map((entry, i) => {
                    const amountCents = entry.amount_cents ?? 0
                    const isPlus = amountCents >= 0
                    const after = entry.balance_after_cents ?? 0
                    const createdAt = entry.created_at ?? ""
                    const txId = entry.tx_id ?? ""
                    const kind = entry.entry_kind ?? ""

                    return (
                      <TableRow key={entry.id ?? i} className="border-border">
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {createdAt ? String(createdAt).slice(0, 16).replace("T", " ") : "---"}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{kind}</TableCell>
                        <TableCell className={`text-sm font-medium text-right ${isPlus ? "text-accent" : "text-destructive"}`}>
                          {isPlus ? "+" : "-"}
                          {formatMoneyFromCents(Math.abs(amountCents))}
                        </TableCell>
                        <TableCell className="text-sm text-foreground text-right">
                          {formatMoneyFromCents(after)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {txId}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2 px-4 pb-4 md:hidden">
            {ledgerItems.length === 0 ? (
              <div className="pt-2 text-sm text-muted-foreground">No ledger entries.</div>
            ) : (
              ledgerItems.map((entry, i) => {
                const amountCents = entry.amount_cents ?? 0
                const isPlus = amountCents >= 0
                const kind = entry.entry_kind ?? ""
                const createdAt = entry.created_at ?? ""

                return (
                  <div key={entry.id ?? i} className="rounded-lg border border-border px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{kind}</span>
                      <span className={`text-sm font-semibold ${isPlus ? "text-accent" : "text-destructive"}`}>
                        {isPlus ? "+" : "-"}
                        {formatMoneyFromCents(Math.abs(amountCents))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">
                        {createdAt ? String(createdAt).slice(0, 16).replace("T", " ") : "---"}
                      </span>
                      <span className="font-mono">{entry.tx_id ?? ""}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
