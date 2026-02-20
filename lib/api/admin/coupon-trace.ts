import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export function useAdminCouponTrace(couponCode: string, includeEvents: boolean) {
  const code = (couponCode || "").trim()

  return useQuery({
    queryKey: ["admin-coupon-trace", code, includeEvents],
    queryFn: () =>
      apiFetch(
        `/admin/coupon-trace/${encodeURIComponent(code)}?include_events=${includeEvents ? "true" : "false"}`
      ),
    enabled: code.length > 0,
  })
}
