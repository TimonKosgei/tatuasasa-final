import { supabase } from './SupabaseClient'

const API_BASE = 'http://localhost:8000'

export async function apiFetch(path, options = {}, fallbackMessage = 'Request failed') {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not signed in')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || fallbackMessage)
  }

  if (res.status === 204) return null

  return res.json()
}