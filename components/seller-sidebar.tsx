"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Coupons", href: "/seller/coupons", icon: Ticket },
]

export function SellerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card/80 lg:backdrop-blur-sm">
      <div className="flex h-14 items-center px-5 border-b border-border">
        <Link
          href="/seller/dashboard"
          className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
            <span className="text-xs font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-sm font-semibold text-foreground">FinAdmin</span>
          <span className="ml-2 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Seller
          </span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:-translate-y-[1px]"
              )}
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full transition-opacity",
                  isActive ? "opacity-100 bg-primary" : "opacity-0"
                )}
              />
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-[1.04]" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}