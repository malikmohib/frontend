"use client"

import { PageShell } from "@/components/page-shell"
import { SellerCouponActions } from "./seller-coupon-actions"
import { SellerCouponEvents } from "./seller-coupon-events"

export default function SellerCouponsPage() {
  return (
    <PageShell title="Coupons" subtitle="Generate coupons and monitor recent activity">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SellerCouponActions />
        </div>

        <div className="lg:col-span-3">
          <SellerCouponEvents />
        </div>
      </div>
    </PageShell>
  )
}