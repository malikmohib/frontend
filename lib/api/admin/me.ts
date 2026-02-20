import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/http"

export type MeOut = {
  id: number
  username: string
  role: string
  full_name: string | null
  email: string | null
  phone: string | null
  country: string | null
  is_active: boolean
  balance_cents: number
  currency: string
}

export function useMe() {
  return useQuery<MeOut>({
    queryKey: ["me"],
    queryFn: () => apiFetch("/me"),
  })
}

export async function changePassword(payload: {
  current_password: string
  new_password: string
  confirm_new_password: string
}) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

