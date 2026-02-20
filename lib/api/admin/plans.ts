import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type AdminPlan = {
  id: number
  category: string
  code: string
  title: string
  warranty_days: number
  is_instant: boolean
  is_active: boolean
  provider_api_params: Record<string, any>
  created_at: string
}

export function useAdminPlans() {
  return useQuery<AdminPlan[]>({
    queryKey: ["admin-plans"],
    queryFn: () => apiFetch(`/admin/plans`),
  })
}
