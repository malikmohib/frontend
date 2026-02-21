import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type SellerChildUser = {
  id: number
  username: string
  role: string
  parent_id: number
  full_name: string | null
  email: string | null
  phone: string | null
  country: string | null
  is_active: boolean
  created_at: string
  balance_cents: number
  currency: string
}

export type SellerChildrenListResponse = {
  items: SellerChildUser[]
}

export type SellerCreateChildInput = {
  username: string
  password: string
  role: "seller" | "agent"
  full_name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
  is_active?: boolean
}

export type SellerUpdateChildInput = {
  role?: "seller" | "agent"
  full_name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
  is_active?: boolean
}

export function useSellerUsers() {
  return useQuery<SellerChildrenListResponse>({
    queryKey: ["seller", "users"],
    queryFn: () => apiFetch(`/sellers/users`),
  })
}

export function useSellerCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SellerCreateChildInput) =>
      apiFetch(`/sellers/users`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["seller", "users"] })
    },
  })
}

export function useSellerUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SellerUpdateChildInput }) =>
      apiFetch(`/sellers/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["seller", "users"] })
    },
  })
}