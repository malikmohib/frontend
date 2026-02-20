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

  seller: {
    dashboard: {
      summaryRollup: "/sellers/dashboard/summary-rollup",
      salesByPlanRollup: "/sellers/dashboard/sales-by-plan-rollup",
      salesBySellerRollup: "/sellers/dashboard/sales-by-seller-rollup",
      profitBySeller: "/sellers/dashboard/profit-by-seller",
      balances: "/sellers/dashboard/balances",
    },
  },
} as const