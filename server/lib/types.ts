// Raw Amadeus API response types

export interface AmadeusTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface AmadeusLocation {
  type: string
  subType: 'CITY' | 'AIRPORT'
  name: string
  detailedName: string
  iataCode: string
  address: {
    cityName: string
    cityCode: string
    countryCode: string
    countryName: string
    regionCode?: string
  }
  geoCode: {
    latitude: number
    longitude: number
  }
  distance?: {
    value: number
    unit: string
  }
  analytics?: {
    travelers?: { score: number }
  }
}

export interface AmadeusLocationsResponse {
  data: AmadeusLocation[]
  meta?: {
    count: number
    links?: { self: string }
  }
}

export interface AmadeusFlightSegment {
  departure: { iataCode: string; at: string }
  arrival: { iataCode: string; at: string }
  carrierCode: string
  number: string
  aircraft: { code: string }
  operating?: { carrierCode: string }
  duration: string   // e.g. "PT5H30M"
  id: string
  numberOfStops: number
}

export interface AmadeusItinerary {
  duration: string
  segments: AmadeusFlightSegment[]
}

export interface AmadeusPrice {
  currency: string
  total: string
  base: string
  grandTotal: string
}

export interface AmadeusFlightOffer {
  type: string
  id: string
  source: string
  nonHomogeneous: boolean
  oneWay: boolean
  lastTicketingDate: string
  itineraries: AmadeusItinerary[]
  price: AmadeusPrice
  validatingAirlineCodes: string[]
  travelerPricings: unknown[]
}

export interface AmadeusFlightOffersResponse {
  data: AmadeusFlightOffer[]
  meta?: {
    count: number
    links?: { self: string }
  }
  errors?: Array<{ title: string; detail: string; status: number }>
}
