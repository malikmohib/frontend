"use client"

import { cn } from "@/lib/utils"
import { useDashboardFilter } from "./dashboard-filter"

const options = [
  { label: "Overall", value: "overall" },
  { label: "Today", value: "today" },
  { label: "Custom", value: "custom" },
] as const

export function DateFilter() {
  const { filter, setFilter } = useDashboardFilter()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = filter.period === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() =>
                setFilter((prev) => ({
                  ...prev,
                  period: opt.value,
                  ...(opt.value !== "custom" ? { date_from: null, date_to: null } : {}),
                }))
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {filter.period === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={filter.date_from || ""}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, date_from: e.target.value || null }))
            }
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={filter.date_to || ""}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, date_to: e.target.value || null }))
            }
          />
        </div>
      ) : null}
    </div>
  )
}