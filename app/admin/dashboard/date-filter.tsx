"use client"

import { cn } from "@/lib/utils"
import { useDashboardFilter } from "./dashboard-filter"

const options = [
  { label: "Overall", value: "overall" },
  { label: "Today", value: "today" },
  { label: "Custom Range", value: "custom" },
] as const

export function DateFilter() {
  const { filter, setFilter } = useDashboardFilter()

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() =>
            setFilter((prev) => ({
              ...prev,
              period: option.value,
              date_from: option.value === "custom" ? prev.date_from : null,
              date_to: option.value === "custom" ? prev.date_to : null,
            }))
          }
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            filter.period === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
