import 'dotenv/config'
import type {
  AmadeusTokenResponse,
  AmadeusLocationsResponse,
  AmadeusFlightOffersResponse,
} from './types.js'
import type { FlightOffer, Leg, FlightSegment } from '../../src/types/flights.js'
import type { Airport } from '../../src/types/airports.js'

const BASE_URL = process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com'
const API_KEY = process.env.AMADEUS_API_KEY ?? ''
const API_SECRET = process.env.AMADEUS_API_SECRET ?? ''

// ─── Rate-limit Queue ────────────────────────────────────────────────────────
// Amadeus test env is strict. We serialize all requests at 1 per 600ms and
// retry once with a 2s backoff on any 429 response.

class RateLimitedQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private readonly intervalMs: number

  constructor(requestsPerSecond = 1.5) {
    this.intervalMs = Math.ceil(1000 / requestsPerSecond)
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn())
        } catch (err) {
          reject(err)
        }
      })
      if (!this.processing) this.drain()
    })
  }

  private async drain() {
    this.processing = true
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!
      await fn()
      if (this.queue.length > 0) {
        await new Promise((r) => setTimeout(r, this.intervalMs))
      }
    }
    this.processing = false
  }
}

const queue = new RateLimitedQueue(1.5)

// ─── Token Cache ────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }

  if (!API_KEY || !API_SECRET) {
    throw new Error('AMADEUS_API_KEY and AMADEUS_API_SECRET must be set in .env')
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: API_KEY,
    client_secret: API_SECRET,
  })

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as AmadeusTokenResponse
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

function log(msg: string) {
  console.log(`[amadeus ${new Date().toISOString().slice(11, 23)}] ${msg}`)
}

async function amadeusGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const queueLen = (queue as unknown as { queue: unknown[] }).queue.length
  log(`QUEUED  ${path}  (queue depth: ${queueLen})`)

  return queue.enqueue(async () => {
    const token = await getToken()
    const url = new URL(`${BASE_URL}${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const shortUrl = `${path}?${url.searchParams.toString().slice(0, 80)}`

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        log(`RETRY   ${shortUrl} — backoff ${2000 * attempt}ms`)
        await new Promise((r) => setTimeout(r, 2000 * attempt))
      }

      log(`→ GET   ${shortUrl}`)
      const t0 = Date.now()
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      log(`← ${res.status} ${shortUrl} (${Date.now() - t0}ms)`)

      if (res.status === 429) {
        log(`429 rate-limited on attempt ${attempt + 1}/3`)
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Amadeus API error (${res.status}) at ${path}: ${text}`)
      }

      return res.json() as Promise<T>
    }

    throw new Error(`Amadeus rate limit persists after retries on ${path}`)
  })
}

// ─── Airport Discovery ───────────────────────────────────────────────────────

export async function searchCities(keyword: string) {
  const data = await amadeusGet<AmadeusLocationsResponse>(
    '/v1/reference-data/locations',
    { keyword, subType: 'CITY', 'page[limit]': '5' }
  )
  return data.data ?? []
}

export async function searchNearbyAirports(
  lat: number,
  lon: number,
  radius = 150
): Promise<Airport[]> {
  const data = await amadeusGet<AmadeusLocationsResponse>(
    '/v1/reference-data/locations/airports',
    {
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      radius: radius.toString(),
      'page[limit]': '4',
      sort: 'analytics.travelers.score',
    }
  )

  return (data.data ?? []).map((loc) => ({
    code: loc.iataCode,
    name: loc.name,
    city: loc.address.cityName,
    country: loc.address.countryCode,
    distance: loc.distance?.value,
  }))
}

// ─── ISO Duration → Minutes ──────────────────────────────────────────────────

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0')
}

// ─── Flight Search ───────────────────────────────────────────────────────────

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string  // YYYY-MM-DD
  returnDate: string     // YYYY-MM-DD
  adults?: number
  nonStop?: boolean
  max?: number
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const query: Record<string, string> = {
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: String(params.adults ?? 1),
    currencyCode: 'USD',
    max: String(params.max ?? 5),
  }
  if (params.nonStop) query.nonStop = 'true'

  const data = await amadeusGet<AmadeusFlightOffersResponse>(
    '/v2/shopping/flight-offers',
    query
  )

  if (!data.data || data.data.length === 0) return []

  return data.data.map((offer) => {
    const outboundRaw = offer.itineraries[0]
    const inboundRaw = offer.itineraries[1]

    const mapLeg = (it: typeof outboundRaw): Leg => {
      const segments: FlightSegment[] = it.segments.map((seg) => ({
        departureAirport: seg.departure.iataCode,
        departureTime: seg.departure.at,
        arrivalAirport: seg.arrival.iataCode,
        arrivalTime: seg.arrival.at,
        carrier: seg.carrierCode,
        flightNumber: seg.number,
        durationMinutes: parseDuration(seg.duration),
      }))
      return {
        durationMinutes: parseDuration(it.duration),
        stops: it.segments.length - 1,
        segments,
        departureTime: segments[0].departureTime,
        arrivalTime: segments[segments.length - 1].arrivalTime,
        departureAirport: segments[0].departureAirport,
        arrivalAirport: segments[segments.length - 1].arrivalAirport,
      }
    }

    return {
      id: offer.id,
      origin: params.origin,
      destination: params.destination,
      price: parseFloat(offer.price.grandTotal),
      currency: offer.price.currency,
      airline: offer.validatingAirlineCodes[0] ?? 'Unknown',
      outbound: mapLeg(outboundRaw),
      inbound: mapLeg(inboundRaw),
    }
  })
}
