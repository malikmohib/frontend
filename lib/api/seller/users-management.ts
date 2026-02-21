import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type SellerPlanPrice = {
  plan_id: number
  title: string
  price_cents: number
}

export type SellerManagedSeller = {
  id: number
  username: string
  role: string
  parent_id: number | null
  parent_username: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  country: string | null
  is_active: boolean
  created_at: string
  balance_cents: number
  currency: string
  plans: SellerPlanPrice[]
}

export type SellerManagedSellerListResponse = {
  items: SellerManagedSeller[]
}

export function useSellerManagedSellers() {
  return useQuery<SellerManagedSellerListResponse>({
    queryKey: ["seller", "managed-sellers"],
    queryFn: () => apiFetch(`/sellers/users`),
  })
}