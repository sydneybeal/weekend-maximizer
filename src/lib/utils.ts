import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function airlineNameFromCode(code: string): string {
  const airlines: Record<string, string> = {
    AA: 'American Airlines',
    UA: 'United Airlines',
    DL: 'Delta Air Lines',
    WN: 'Southwest Airlines',
    B6: 'JetBlue',
    F9: 'Frontier Airlines',
    NK: 'Spirit Airlines',
    AS: 'Alaska Airlines',
    HA: 'Hawaiian Airlines',
    G4: 'Allegiant Air',
    BA: 'British Airways',
    VS: 'Virgin Atlantic',
    AC: 'Air Canada',
    WS: 'WestJet',
    AF: 'Air France',
    LH: 'Lufthansa',
    KL: 'KLM',
    IB: 'Iberia',
    EK: 'Emirates',
    QR: 'Qatar Airways',
  }
  return airlines[code] ?? code
}

export function airportCityMap(code: string): string {
  const cities: Record<string, string> = {
    PHL: 'Philadelphia', EWR: 'Newark', BWI: 'Baltimore',
    JFK: 'New York', LGA: 'New York', ORD: 'Chicago', MDW: 'Chicago',
    LAX: 'Los Angeles', SFO: 'San Francisco', SAN: 'San Diego',
    DEN: 'Denver', PHX: 'Phoenix', PDX: 'Portland', SEA: 'Seattle',
    LAS: 'Las Vegas', MIA: 'Miami', TPA: 'Tampa', MCO: 'Orlando',
    ATL: 'Atlanta', DFW: 'Dallas', IAH: 'Houston', HOU: 'Houston',
    BOS: 'Boston', MSP: 'Minneapolis', DTW: 'Detroit', CLT: 'Charlotte',
    LHR: 'London', LGW: 'London', STN: 'London',
    YUL: 'Montreal', YYZ: 'Toronto', YVR: 'Vancouver',
    MSY: 'New Orleans', CUN: 'Cancún', MEX: 'Mexico City',
    CDG: 'Paris', AMS: 'Amsterdam', FCO: 'Rome', MAD: 'Madrid',
  }
  return cities[code] ?? code
}
