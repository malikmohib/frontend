import { SellerSidebar } from "@/components/seller-sidebar"
import { SellerMobileBottomNav } from "@/components/seller-mobile-bottom-nav"
import { Topbar } from "@/components/topbar"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import { RouteTransition } from "@/components/route-transition"

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <SellerSidebar />

        <div className="lg:pl-60">
          <Topbar />

          <main className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-6 lg:pb-6">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>

        <SellerMobileBottomNav />
        <Toaster />
      </div>
    </QueryProvider>
  )
}