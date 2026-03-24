// Static airport lookup — no API calls, no rate limits, instant.
// Uses the `airport-codes` npm package (OpenFlights data, ~8,000 airports).

import { createRequire } from 'module'
import type { Airport } from '../../src/types/airports.js'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const airportList: any[] = require('airport-codes/airports.json')

interface RawAirport {
  iata: string
  name: string
  city: string
  country: string
  latitude: string    // stored as strings in this dataset
  longitude: string
  altitude?: string
  timezone?: string
  tz?: string
}

// Filter to airports with IATA codes and valid coordinates
const airports: RawAirport[] = (airportList as unknown as RawAirport[]).filter(
  (a) =>
    a.iata &&
    a.iata.length === 3 &&
    a.iata !== '\\N' &&
    a.city &&
    a.latitude &&
    a.longitude &&
    !isNaN(parseFloat(a.latitude)) &&
    !isNaN(parseFloat(a.longitude))
)

// Known major hubs — prioritised in nearby airport results
const MAJOR_IATA = new Set([
  'ATL','LAX','ORD','DFW','DEN','JFK','SFO','SEA','LAS','MCO',
  'EWR','CLT','PHX','IAH','MIA','BOS','MSP','DTW','FLL','PHL',
  'BWI','SLC','DCA','SAN','TPA','HOU','MDW','PDX','STL','BNA',
  'AUS','HNL','OAK','SJC','RDU','DAL','SNA','SMF','MCI','MKE',
  'JAX','OGG','CLE','BUF','RIC','SAT','IND','CMH','PIT','MSY',
  'ACY','ISP','HPN','PVD','ORF','GSO','BDL','RNO','ABQ','OKC',
  'LHR','LGW','STN','LTN','MAN','BHX','EDI','GLA',
  'CDG','ORY','LYS','NCE','MRS',
  'AMS','BRU','ZRH','VIE','MUC','FRA','DUS','HAM','BER','CGN',
  'FCO','MXP','LIN','VCE','NAP','BCN','MAD','LIS','OPO','ATH',
  'IST','SAW','SVO','LED','DME','VKO',
  'DXB','DOH','AUH','KWI','BAH','RUH',
  'YYZ','YUL','YVR','YYC','YOW','YEG','YHZ',
  'MEX','CUN','GDL','MTY','TLC',
  'GRU','GIG','BOG','LIM','SCL','EZE','UIO','BSB',
  'SYD','MEL','BNE','PER','ADL','AKL','CHC','WLG',
  'SIN','BKK','KUL','CGK','MNL','HKG','TPE','ICN','NRT','HND',
  'KIX','NGO','CTS','PEK','PVG','CAN','CTU','SZX','XIY','WUH',
  'JNB','CPT','CAI','LOS','ADD','NBO','ACC','CMN',
  'DEL','BOM','MAA','BLR','HYD','CCU','AMD','COK',
])

// ─── Haversine distance ──────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AirportSearchResult {
  name: string
  code: string
  country: string
  lat: number
  lon: number
  airports: Airport[]
}

export function searchAirportsByCity(query: string): AirportSearchResult | null {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return null

  // Try exact IATA code match first (e.g. "PHL", "PHX")
  const iataMatch = airports.find((a) => a.iata.toLowerCase() === q)
  if (iataMatch) {
    const mainLat = parseFloat(iataMatch.latitude)
    const mainLon = parseFloat(iataMatch.longitude)
    const nearby = airports
      .map((a) => ({
        a,
        km: haversineKm(mainLat, mainLon, parseFloat(a.latitude), parseFloat(a.longitude)),
        major: MAJOR_IATA.has(a.iata),
      }))
      .filter(({ km }) => km <= 150)
      .sort((x, y) => {
        if (x.major && !y.major) return -1
        if (!x.major && y.major) return 1
        return x.km - y.km
      })
      .slice(0, 4)
      .map(({ a, km }): Airport => ({
        code: a.iata,
        name: a.name,
        city: a.city,
        country: a.country,
        distance: Math.round(km),
      }))
    return {
      name: iataMatch.city,
      code: iataMatch.iata,
      country: iataMatch.country,
      lat: mainLat,
      lon: mainLon,
      airports: nearby,
    }
  }

  // Prefix match on city name first, substring fallback
  let matches = airports.filter((a) => a.city.toLowerCase().startsWith(q))
  if (matches.length === 0) {
    matches = airports.filter((a) => a.city.toLowerCase().includes(q))
  }
  if (matches.length === 0) return null

  // Pick main airport: prefer known major hubs
  const main = matches.find((a) => MAJOR_IATA.has(a.iata)) ?? matches[0]
  const mainLat = parseFloat(main.latitude)
  const mainLon = parseFloat(main.longitude)

  // Find all airports within 150 km, major hubs first then by distance
  const nearby = airports
    .map((a) => ({
      a,
      km: haversineKm(mainLat, mainLon, parseFloat(a.latitude), parseFloat(a.longitude)),
      major: MAJOR_IATA.has(a.iata),
    }))
    .filter(({ km }) => km <= 150)
    .sort((x, y) => {
      if (x.major && !y.major) return -1
      if (!x.major && y.major) return 1
      return x.km - y.km
    })
    .slice(0, 4)
    .map(({ a, km }): Airport => ({
      code: a.iata,
      name: a.name,
      city: a.city,
      country: a.country,
      distance: Math.round(km),
    }))

  return {
    name: main.city,
    code: main.iata,
    country: main.country,
    lat: mainLat,
    lon: mainLon,
    airports: nearby,
  }
}
