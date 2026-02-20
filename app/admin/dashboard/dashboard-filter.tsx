"use client"

import * as React from "react"

export type DashboardPeriod = "overall" | "today" | "custom"

export type DashboardFilterState = {
  period: DashboardPeriod
  date_from?: string | null
  date_to?: string | null
  limit: number
}

const DashboardFilterContext = React.createContext<{
  filter: DashboardFilterState
  setFilter: React.Dispatch<React.SetStateAction<DashboardFilterState>>
} | null>(null)

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = React.useState<DashboardFilterState>({
    period: "today",
    date_from: null,
    date_to: null,
    limit: 50,
  })

  return (
    <DashboardFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </DashboardFilterContext.Provider>
  )
}

export function useDashboardFilter() {
  const ctx = React.useContext(DashboardFilterContext)
  if (!ctx) throw new Error("useDashboardFilter must be used inside DashboardFilterProvider")
  return ctx
}
