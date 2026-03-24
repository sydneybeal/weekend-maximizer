import 'dotenv/config'
import type { FlightOffer, Leg, FlightSegment } from '../../src/types/flights.js'

// Travelpayouts Data API — cached cheapest prices, no approval needed.
// The Live Search API (/v1/flight_search) returns 403 without a separate
// partner approval from Travelpayouts — use that if you get approved.

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN ?? ''
const BASE  = 'https://api.travelpayouts.com'

// ─── Response types ───────────────────────────────────────────────────────────

interface TpOffer {
  price: number
  airline: string
  flight_number: number | string
  departure_at: string
  return_at: string
  expires_at?: string
  transfers?: number
  duration: number
  duration_to?: number
  duration_back?: number
}

// Data API: data[destinationIATA][index] = TpOffer
type TpCheapData = Record<string, Record<string, TpOffer>>

interface TpCheapResponse {
  success: boolean
  data: TpCheapData
  currency: string
  error?: string
}

// ─── Transform ────────────────────────────────────────────────────────────────

function addMinutes(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60_000).toISOString()
}

function makeLeg(
  dep: string,
  arr: string,
  depIso: string,
  durationMin: number,
  stops: number,
  carrier: string,
  flightNumber: string,
): Leg {
  const arrIso = addMinutes(depIso, durationMin)
  const seg: FlightSegment = {
    departureAirport: dep,
    departureTime: depIso,
    arrivalAirport: arr,
    arrivalTime: arrIso,
    carrier,
    flightNumber,
    durationMinutes: durationMin,
  }
  return {
    durationMinutes: durationMin,
    stops,
    segments: [seg],
    departureTime: depIso,
    arrivalTime: arrIso,
    departureAirport: dep,
    arrivalAirport: arr,
  }
}

function transform(offer: TpOffer, origin: string, destination: string, id: string): FlightOffer {
  const outDur = offer.duration_to  ?? Math.round(offer.duration / 2)
  const inDur  = offer.duration_back ?? Math.round(offer.duration / 2)
  const stops  = offer.transfers ?? -1  // -1 = unknown, don't display as "Nonstop"
  return {
    id,
    origin,
    destination,
    price: offer.price,
    currency: 'USD',
    airline: offer.airline,
    outbound: makeLeg(origin,      destination, offer.departure_at, outDur, stops, offer.airline, String(offer.flight_number)),
    inbound:  makeLeg(destination, origin,      offer.return_at,   inDur,  stops, offer.airline, String(offer.flight_number)),
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchParams {
  origin: string
  destination: string
  month: string       // YYYY-MM
  tripNights: number  // unused for Data API but kept for interface consistency
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  if (!TOKEN) {
    throw new Error('TRAVELPAYOUTS_TOKEN must be set in .env')
  }

  const url = new URL(`${BASE}/v1/prices/cheap`)
  url.searchParams.set('origin',      params.origin)
  url.searchParams.set('destination', params.destination)
  url.searchParams.set('depart_date', params.month)
  url.searchParams.set('currency',    'USD')
  url.searchParams.set('token',       TOKEN)

  console.log(`[tp] → GET cheap ${params.origin}→${params.destination} ${params.month}`)

  const res = await fetch(url.toString())

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Travelpayouts Data API (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as TpCheapResponse

  if (!json.success) {
    throw new Error(`Travelpayouts error: ${json.error ?? JSON.stringify(json)}`)
  }

  const destData = json.data?.[params.destination]
  if (!destData) {
    console.log(`[tp] ← no data for ${params.origin}→${params.destination}`)
    return []
  }

  const offers = Object.entries(destData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, offer]) =>
      transform(offer, params.origin, params.destination, `${params.origin}-${params.destination}-${idx}`)
    )

  console.log(`[tp] ← ${offers.length} offers for ${params.origin}→${params.destination}`)
  return offers
}
