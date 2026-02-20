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
  "/admin/wallet": "Wallet",
  "/admin/balance-history": "Balance History",
  "/admin/reports": "Reports",
  "/admin/users-tree": "Users Tree",
}

export function Topbar() {
  const pathname = usePathname()

  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Admin"

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
      <h2 className="text-base font-semibold text-foreground lg:hidden">
        {title}
      </h2>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* ✅ Profile dropdown menu */}
        <AdminProfileMenu />
      </div>
    </header>
  )
}
