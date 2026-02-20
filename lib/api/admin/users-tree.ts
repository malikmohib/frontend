import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type AdminUsersTreeItem = {
  id: number
  username: string
  role: string
  parent_id: number
  telegram_id: string
  is_active: boolean
  created_at: string
  path: string
  depth: number
}

export type AdminUsersTreeResponse = {
  items: AdminUsersTreeItem[]
}

export function useAdminUsersTree() {
  return useQuery<AdminUsersTreeResponse>({
    queryKey: ["admin-users-tree"],
    queryFn: () => apiFetch("/admin/users/tree"),
  })
}
