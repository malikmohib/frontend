"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminProfileMenu } from "@/components/admin-profile-menu"

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/coupons": "Coupons",
  "/admin/coupon-trace": "Coupon Trace",
  "/admin/balance-history": "Balance History",
  "/admin/reports": "Reports",
  "/admin/sellers": "Sellers",
  "/admin/users-tree": "Users Tree",
  "/admin/wallet": "Wallet",

  // Seller
  "/seller/dashboard": "Dashboard",
}

export function Topbar() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "FinAdmin"

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 lg:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <AdminProfileMenu />
        </div>
      </div>
    </header>
  )
}