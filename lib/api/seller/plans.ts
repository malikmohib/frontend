import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type SellerPlanDropdown = {
  id: number
  title: string
  category: string
  is_active: boolean
}

export function useSellerAvailablePlans() {
  return useQuery<SellerPlanDropdown[]>({
    queryKey: ["seller", "plans", "available"],
    queryFn: () => apiFetch(`/sellers/plans/available`),
  })
}