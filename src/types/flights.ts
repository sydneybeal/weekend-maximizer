export interface FlightSegment {
  departureAirport: string    // IATA
  departureTime: string       // ISO 8601
  arrivalAirport: string      // IATA
  arrivalTime: string         // ISO 8601
  carrier: string             // airline code e.g. "AA"
  flightNumber: string
  durationMinutes: number
}

export interface Leg {
  durationMinutes: number
  stops: number
  segments: FlightSegment[]
  departureTime: string       // first segment departure
  arrivalTime: string         // last segment arrival
  departureAirport: string
  arrivalAirport: string
}

export interface FlightOffer {
  id: string
  origin: string              // IATA
  destination: string         // IATA
  price: number
  currency: string
  airline: string             // primary validating carrier
  outbound: Leg
  inbound: Leg
  score?: number              // computed recommendation score
}

export interface DestinationResult {
  destination: string         // IATA airport code
  destinationCity: string     // city name
  destinationCountry: string  // country
  offers: FlightOffer[]
  bestOffer?: FlightOffer     // lowest price offer
  isLoading: boolean
  error?: string
}

export type SortKey = 'price' | 'duration' | 'score' | 'stops'
export type FilterKey = 'nonstop' | 'all'
