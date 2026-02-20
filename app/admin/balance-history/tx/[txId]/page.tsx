"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import { useAdminBalanceHistory } from "@/lib/api/admin/balance-history"

const KIND_LABELS: Record<string, string> = {
  admin_topup: "Admin Top Up",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  purchase_debit: "Purchase Debit",
  profit_credit: "Profit Credit",
}

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

export default function TxDetailPage() {
  const routeParams = useParams<{ txId: string }>()
  const searchParams = useSearchParams()

  const txId = typeof routeParams?.txId === "string" ? routeParams.txId : ""
  const username = (searchParams.get("u") ?? "").trim()

  const q = useAdminBalanceHistory({
    username,
    tx_id: txId,
    limit: 200,
    offset: 0,
  })

  const rows = q.data?.items ?? []

  return (
    <PageShell
      title="Transaction Details"
      subtitle={txId || "—"}
      actions={
        <Link href="/admin/balance-history">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
      }
    >
      {!txId && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Missing <span className="font-mono">txId</span> in route.
          </CardContent>
        </Card>
      )}

      {txId && !username && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Missing required <span className="font-mono">username</span> for this
            transaction view. Please open this page from Balance History.
          </CardContent>
        </Card>
      )}

      {txId && username && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">
              {username}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {q.isFetching && (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            )}

            {q.isError && (
              <div className="p-4 text-sm text-destructive">
                Failed to load transaction entries.
              </div>
            )}

            {!q.isFetching && !q.isError && rows.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No entries found for this tx.
              </div>
            )}

            {rows.length > 0 && (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Kind
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground text-right">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground text-right">
                          Balance After
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Note
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Related
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {rows.map((it) => {
                        const isPositive = it.amount_cents >= 0
                        const kindLabel = KIND_LABELS[it.entry_kind] ?? it.entry_kind

                        return (
                          <TableRow key={it.id} className="border-border">
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {formatDate(it.created_at)}
                            </TableCell>

                            <TableCell className="text-sm text-foreground">
                              {kindLabel}
                            </TableCell>

                            <TableCell
                              className={`text-sm font-medium text-right ${
                                isPositive ? "text-accent" : "text-destructive"
                              }`}
                            >
                              {formatSignedUsdFromCents(it.amount_cents)}
                            </TableCell>

                            <TableCell className="text-sm text-foreground text-right">
                              {formatUsdFromCents(it.balance_after_cents)}
                            </TableCell>

                            {/* Not provided by this endpoint */}
                            <TableCell className="text-xs text-muted-foreground">
                              —
                            </TableCell>

                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                ---
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-2 px-4 pb-4 md:hidden">
                  {rows.map((it) => {
                    const isPositive = it.amount_cents >= 0
                    const kindLabel = KIND_LABELS[it.entry_kind] ?? it.entry_kind

                    return (
                      <div
                        key={it.id}
                        className="rounded-lg border border-border px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{kindLabel}</span>
                          <span
                            className={`text-sm font-semibold ${
                              isPositive ? "text-accent" : "text-destructive"
                            }`}
                          >
                            {formatSignedUsdFromCents(it.amount_cents)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">—</p>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-mono">{formatDate(it.created_at)}</span>
                          <span>{formatUsdFromCents(it.balance_after_cents)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
