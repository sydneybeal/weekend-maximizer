import { useQuery } from '@tanstack/react-query'
import type { CityResult } from '../types/airports.js'

async function fetchAirports(query: string): Promise<CityResult[]> {
  const res = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' })) as { error: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<CityResult[]>
}

export function useAirportSearch(query: string) {
  return useQuery({
    queryKey: ['airports', query],
    queryFn: () => fetchAirports(query),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,        // airport data is stable
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
}
