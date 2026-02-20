import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type AdminUserTreeWithBalanceItem = {
  id: number
  username: string
  full_name: string | null
  role: string
  parent_id: number | null
  depth: number
  is_active: boolean
  balance_cents: number
  currency: string
}

export type AdminUserTreeWithBalanceOut = {
  items: AdminUserTreeWithBalanceItem[]
}

export function useAdminUsersTreeWithBalance() {
  return useQuery<AdminUserTreeWithBalanceOut>({
    queryKey: ["admin", "users", "tree-with-balance"],
    queryFn: () => apiFetch(`/admin/users/tree-with-balance`),
  })
}
