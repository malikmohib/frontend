// lib/api/auth.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: string // "bearer"
}

export type MeResponse = {
  id: number
  username: string
  role: "admin" | "seller" | "agent"
  full_name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
  is_active: boolean
  balance_cents: number
  currency: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
  const body = new URLSearchParams()
  body.set("username", username)
  body.set("password", password)

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Login failed")
  }

  return res.json()
}

export function setTokens(tokens: LoginResponse) {
  localStorage.setItem("access_token", tokens.access_token)
  localStorage.setItem("refresh_token", tokens.refresh_token)
  localStorage.setItem("token_type", tokens.token_type)
}

export function clearTokens() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("token_type")
}

export async function getMe(): Promise<MeResponse> {
  const access = localStorage.getItem("access_token")
  if (!access) throw new Error("Missing access token")

  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to load user")
  }

  return res.json()
}