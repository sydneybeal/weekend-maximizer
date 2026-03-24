import 'dotenv/config'
import type { FlightOffer, Leg, FlightSegment } from '../../src/types/flights.js'

const CLIENT_ID     = process.env.AMADEUS_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET ?? ''
const BASE_URL      = process.env.AMADEUS_BASE_URL      ?? 'https://test.api.amadeus.com'

// ─── OAuth2 token cache ───────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }
  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Amadeus auth failed (${res.status}): ${text.slice(0, 200)}`)
  }
  const data = await res.json() as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1_000 }
  return cachedToken.value
}

// ─── Amadeus response types ───────────────────────────────────────────────────

interface AmadeusSegment {
  departure: { iataCode: string; at: string }
  arrival:   { iataCode: string; at: string }
  carrierCode:    string
  number:         string
  duration:       string   // ISO 8601 e.g. "PT6H30M"
  numberOfStops:  number
}

interface AmadeusItinerary {
  duration: string
  segments: AmadeusSegment[]
}

interface AmadeusFlight {
  id:            string
  itineraries:   [AmadeusItinerary, AmadeusItinerary]
  price:         { total: string; currency: string }
  validatingAirlineCodes: string[]
}

interface AmadeusResponse {
  data?:   AmadeusFlight[]
  errors?: Array<{ detail: string }>
}

// ─── Transform ────────────────────────────────────────────────────────────────

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  return (parseInt(m?.[1] ?? '0', 10) * 60) + parseInt(m?.[2] ?? '0', 10)
}

function transformLeg(itin: AmadeusItinerary): Leg {
  const segs = itin.segments
  const segments: FlightSegment[] = segs.map((s) => ({
    departureAirport: s.departure.iataCode,
    departureTime:    s.departure.at,
    arrivalAirport:   s.arrival.iataCode,
    arrivalTime:      s.arrival.at,
    carrier:          s.carrierCode,
    flightNumber:     `${s.carrierCode}${s.number}`,
    durationMinutes:  parseDuration(s.duration),
  }))
  return {
    durationMinutes:  parseDuration(itin.duration),
    stops:            segs.length - 1,
    segments,
    departureTime:    segs[0].departure.at,
    arrivalTime:      segs[segs.length - 1].arrival.at,
    departureAirport: segs[0].departure.iataCode,
    arrivalAirport:   segs[segs.length - 1].arrival.iataCode,
  }
}

function transformFlight(
  flight: AmadeusFlight,
  origin: string,
  destination: string,
  id: string,
): FlightOffer {
  return {
    id,
    origin,
    destination,
    price:    parseFloat(flight.price.total),
    currency: flight.price.currency,
    airline:  flight.validatingAirlineCodes[0] ?? flight.itineraries[0].segments[0].carrierCode,
    outbound: transformLeg(flight.itineraries[0]),
    inbound:  transformLeg(flight.itineraries[1]),
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Return all departure-day→(departure+tripNights) pairs within the given YYYY-MM month. */
function weekendPairs(
  month: string,
  tripNights: number,
  departureDay: number,
): Array<{ departureDate: string; returnDate: string }> {
  const [y, m] = month.split('-').map(Number)
  const pairs: Array<{ departureDate: string; returnDate: string }> = []
  const d = new Date(y, m - 1, 1)
  while (d.getMonth() === m - 1) {
    if (d.getDay() === departureDay) {
      const dep = toYMD(d)
      const ret = toYMD(new Date(d.getFullYear(), d.getMonth(), d.getDate() + tripNights))
      pairs.push({ departureDate: dep, returnDate: ret })
    }
    d.setDate(d.getDate() + 1)
  }
  return pairs
}

// ─── Fetch one weekend's offers ───────────────────────────────────────────────

async function fetchOffers(
  token: string,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
): Promise<FlightOffer[]> {
  const url = new URL(`${BASE_URL}/v2/shopping/flight-offers`)
  url.searchParams.set('originLocationCode',      origin)
  url.searchParams.set('destinationLocationCode', destination)
  url.searchParams.set('departureDate',           departureDate)
  url.searchParams.set('returnDate',              returnDate)
  url.searchParams.set('adults',                  '1')
  url.searchParams.set('max',                     '5')
  url.searchParams.set('currencyCode',            'USD')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Amadeus API (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json() as AmadeusResponse
  if (json.errors?.length) {
    throw new Error(`Amadeus error: ${json.errors[0].detail}`)
  }

  return (json.data ?? []).map((flight, i) =>
    transformFlight(
      flight,
      origin,
      destination,
      `${origin}-${destination}-${departureDate}-${i}`,
    )
  )
}

// ─── Result cache ─────────────────────────────────────────────────────────────

const RESULT_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

interface CacheEntry {
  offers:    FlightOffer[]
  cachedAt:  number
}

const resultCache = new Map<string, CacheEntry>()

function resultCacheKey(p: SearchParams): string {
  return `${p.origin}:${p.destination}:${p.month}:${p.tripNights}:${p.departureDay}`
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SearchParams {
  origin:       string
  destination:  string
  month:        string  // YYYY-MM
  tripNights:   number
  departureDay: number  // 0=Sun … 6=Sat
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const key = resultCacheKey(params)
  const cached = resultCache.get(key)
  if (cached && Date.now() - cached.cachedAt < RESULT_CACHE_TTL) {
    console.log(`[amadeus] cache hit ${params.origin}→${params.destination} ${params.month}`)
    return cached.offers
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set in .env')
  }

  const token = await getToken()
  const pairs = weekendPairs(params.month, params.tripNights, params.departureDay)

  console.log(
    `[amadeus] → ${params.origin}→${params.destination} ${params.month} (${pairs.length} weekends)`
  )

  const allOffers: FlightOffer[] = []
  for (const { departureDate, returnDate } of pairs) {
    try {
      const offers = await fetchOffers(token, params.origin, params.destination, departureDate, returnDate)
      allOffers.push(...offers)
    } catch (err) {
      console.warn(`[amadeus] skipping ${departureDate}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`[amadeus] ← ${allOffers.length} offers for ${params.origin}→${params.destination}`)
  resultCache.set(key, { offers: allOffers, cachedAt: Date.now() })
  return allOffers
}
