export interface Airport {
  code: string       // IATA code e.g. "PHL"
  name: string       // "Philadelphia International"
  city: string       // "Philadelphia"
  country: string    // "US"
  distance?: number  // km from searched city center
}

export interface CityResult {
  keyword: string    // what the user typed
  name: string       // resolved city name
  code: string       // city IATA code
  country: string
  lat: number
  lon: number
  airports: Airport[]
}

export interface SearchedCity {
  id: string         // unique id for this origin/dest slot
  keyword: string    // user input
  resolved?: CityResult
  selectedAirports: string[]  // which airport IATA codes are toggled on
}
