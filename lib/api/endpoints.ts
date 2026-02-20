// lib/api/endpoints.ts

export const endpoints = {
  admin: {
    dashboard: {
      summary: "/admin/dashboard/summary",
      salesByPlan: "/admin/dashboard/sales-by-plan",
      salesBySeller: "/admin/dashboard/sales-by-seller",
      profitBySeller: "/admin/dashboard/profit-by-seller",
      balances: "/admin/dashboard/balances",
    },
  },
} as const;
