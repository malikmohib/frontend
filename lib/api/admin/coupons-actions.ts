import { apiFetch } from "@/lib/api/http"

export type AdminCoupon = {
  coupon_code: string
  plan_id: number
  status: string
  created_by_user_id: number
  owner_user_id: number
  reserved_by_user_id: number
  reserved_udid_suffix: string
  reserved_at: string
  used_by_user_id: number
  used_udid_suffix: string
  used_at: string
  last_failure_reason: string
  last_failure_step: string
  last_failed_at: string
  provider_req_id: string
  notes: string
  created_at: string
}

export type AdminGenerateCouponsBody = {
  plan_id: number
  count: number
  notes: string
}


export async function adminGenerateCoupons(body: AdminGenerateCouponsBody) {
  return apiFetch(`/admin/coupons`, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<AdminCoupon[]>
}

export type AdminUnreserveCouponBody = {
  reason: string
}

export async function adminUnreserveCoupon(
  couponCode: string,
  body: AdminUnreserveCouponBody
) {
  const encoded = encodeURIComponent(couponCode)
  return apiFetch(`/admin/coupons/${encoded}/unreserve`, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<AdminCoupon>
}
