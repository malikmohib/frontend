import { apiFetch } from "@/lib/api/http"

export type SellerCoupon = {
  coupon_code: string
  plan_id: number
  status: string

  created_by_user_id: number | null
  owner_user_id: number | null

  reserved_by_user_id: number | null
  reserved_udid_suffix: string | null
  reserved_at: string | null

  used_by_user_id: number | null
  used_udid_suffix: string | null
  used_at: string | null

  last_failure_reason: string | null
  last_failure_step: string | null
  last_failed_at: string | null

  provider_req_id: string | null
  notes: string | null
  created_at: string
}

export type SellerGenerateCouponsBody = {
  plan_id: number
  count: number
  notes?: string
  // owner_user_id intentionally omitted for now (we’ll add when seller/users exists)
}

export async function sellerGenerateCoupons(body: SellerGenerateCouponsBody) {
  return apiFetch(`/sellers/coupons`, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<SellerCoupon[]>
}