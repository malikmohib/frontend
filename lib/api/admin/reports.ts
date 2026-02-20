import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    qs.set(k, String(v))
  })
  const str = qs.toString()
  return str ? `?${str}` : ""
}

export type AdminOrdersReportParams = {
  // OPTIONAL:
  // - empty/undefined/null => backend returns all sellers below current admin
  // - provided => backend filters to that seller
  username?: string | null

  plan_id?: number | null
  status?: string | null
  date_from?: string | null // date-time
  date_to?: string | null // date-time
  limit?: number // default 5000
  offset?: number // default 0
}

export type AdminOrdersReportItem = {
  order_no: number
  created_at: string
  plan_id: number
  plan_title: string
  plan_category: string
  quantity: number
  unit_price_cents: number
  total_paid_cents: number
  currency: "USD" | string
  coupon_codes: string[]
  serials: string[]
  keys_text: string
  serials_text: string
}

export type AdminOrdersReportResponse = {
  // Keep existing contract (backend may return "" or some label when username omitted)
  username: string
  buyer_user_id: number | null
  date_from: string | null
  date_to: string | null
  plan_id: number | null
  status: string | null
  items: AdminOrdersReportItem[]
  total: number
}

export function useAdminOrdersReport(params: AdminOrdersReportParams) {
  const username =
    params.username && params.username.trim().length > 0
      ? params.username.trim()
      : null

  const qs = buildQuery({
    username,
    plan_id: params.plan_id,
    status: params.status,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit ?? 5000,
    offset: params.offset ?? 0,
  })

  return useQuery<AdminOrdersReportResponse>({
    queryKey: ["admin-reports-orders", { ...params, username }],
    queryFn: () => apiFetch(`/admin/reports/orders${qs}`),
    // IMPORTANT: always enabled (default page shows all sellers)
    enabled: true,
  })
}

async function downloadPdf(urlPathWithQuery: string, filename: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const res = await fetch(`${base}${urlPathWithQuery}`, {
    method: "GET",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Download failed (${res.status}): ${text}`)
  }

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  URL.revokeObjectURL(href)
}

export type AdminSellerOrdersPdfParams = {
  // OPTIONAL (same rule as report query):
  // - empty/undefined/null => all sellers below current admin
  // - provided => that seller only
  username?: string | null

  plan_id?: number | null
  date_from?: string | null // date-time
  date_to?: string | null // date-time
  limit?: number // default 5000
}

export async function downloadAdminSellerOrdersPdf(
  params: AdminSellerOrdersPdfParams
) {
  const username =
    params.username && params.username.trim().length > 0
      ? params.username.trim()
      : null

  const qs = buildQuery({
    username,
    plan_id: params.plan_id,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit ?? 5000,
  })

  const name = username ? username : "all-sellers"

  return downloadPdf(
    `/admin/reports/seller-orders.pdf${qs}`,
    `seller-orders-${name}.pdf`
  )
}
