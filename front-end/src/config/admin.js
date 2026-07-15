import { supabase } from './supabaseClient'
import { apiFetch } from './api'

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name')
  if (error) throw error
  return data
}

export function listSupervisors() {
  return apiFetch('/admin/supervisors', {}, 'Failed to load supervisors')
}

export function createSupervisor({ email, password, fullName, department }) {
  return apiFetch(
    '/admin/supervisors',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, department }),
    },
    'Failed to create supervisor'
  )
}