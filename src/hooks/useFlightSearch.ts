import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { FlightOffer, DestinationResult } from '../types/flights.js'
import { scoreOffers } from '../lib/scoring.js'
import { airportCityMap } from '../lib/utils.js'

interface SearchTriplet {
  origin: string
  destination: string
  month: string        // YYYY-MM
}

interface SearchParams {
  triplets: SearchTriplet[]
  tripNights: number
  departureDay: number  // 0=Sun … 6=Sat
  enabled: boolean
}

function offerNights(offer: FlightOffer): number {
  const dep = new Date(offer.outbound.departureTime).getTime()
  const ret = new Date(offer.inbound.departureTime).getTime()
  return Math.round((ret - dep) / 86400000)
}

interface FlightSearchResponse {
  origin: string
  destination: string
  offers: FlightOffer[]
  error?: string
}

async function fetchFlights(
  origin: string,
  destination: string,
  month: string,
  tripNights: number,
  departureDay: number,
): Promise<FlightSearchResponse> {
  const res = await fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, month, tripNights, departureDay }),
  })
  if (!res.ok) return { origin, destination, offers: [], error: `HTTP ${res.status}` }
  return res.json() as Promise<FlightSearchResponse>
}

export function useFlightSearch({ triplets, tripNights, departureDay, enabled }: SearchParams) {
  const queries = useQueries({
    queries: triplets.map(({ origin, destination, month }) => ({
      queryKey: ['flights', origin, destination, month, tripNights, departureDay],
      queryFn: () => fetchFlights(origin, destination, month, tripNights, departureDay),
      enabled,
      staleTime: 6 * 60 * 60 * 1000,  // server caches for 6h, no point re-fetching sooner
      gcTime: 6 * 60 * 60 * 1000,
      retry: 1,
    })),
  })

  const totalSearches = triplets.length
  const completedSearches = queries.filter((q) => q.isSuccess || q.isError).length
  const isLoading = queries.some((q) => q.isFetching)
  const progress = totalSearches > 0 ? (completedSearches / totalSearches) * 100 : 0

  const resultsByDestination = useMemo<DestinationResult[]>(() => {
    const allOffers: FlightOffer[] = queries
      .filter((q) => q.isSuccess && q.data)
      .flatMap((q) => q.data!.offers)

    const destCodes = [...new Set(triplets.map((t) => t.destination))]

    return destCodes.map((dest) => {
      const destOffers = allOffers
        .filter((o) => o.destination === dest)
        .filter((o) => Math.abs(offerNights(o) - tripNights) <= 2)
      const scored = scoreOffers(destOffers)
      const bestOffer = scored.sort((a, b) => b.score - a.score)[0]

      const destQueries = queries.filter((_, i) => triplets[i]?.destination === dest)
      const destLoading = destQueries.some((q) => q.isFetching || q.isPending)
      const destError = destQueries.every((q) => q.isError) ? 'No flights found' : undefined

      return {
        destination: dest,
        destinationCity: airportCityMap(dest),
        destinationCountry: '',
        offers: scored,
        bestOffer,
        isLoading: destLoading,
        error: destError,
      }
    })
  }, [queries, triplets, tripNights])

  return { resultsByDestination, isLoading, progress, completedSearches, totalSearches }
}
