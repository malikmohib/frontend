import { AdminSidebar } from "@/components/admin-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Topbar } from "@/components/topbar"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster" // ✅ add this

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:pl-60">
          <Topbar />
          <main className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-6 lg:pb-6">
            {children}
          </main>
        </div>
        <MobileBottomNav />

        {/* ✅ add this at bottom so toast works */}
        <Toaster />
      </div>
    </QueryProvider>
  )
}
