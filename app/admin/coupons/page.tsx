"use client"

import { PageShell } from "@/components/page-shell"
import { CouponActions } from "./coupon-actions"
import { CouponEvents } from "./coupon-events"

export default function CouponsPage() {
  return (
    <PageShell title="Coupons" subtitle="Manage coupon lifecycle actions">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CouponActions />
        </div>
        <div className="lg:col-span-3">
          <CouponEvents />
        </div>
      </div>
    </PageShell>
  )
}
