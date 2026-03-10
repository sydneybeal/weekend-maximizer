import type { FlightOffer } from '../types/flights.js'

export interface ScoredOffer extends FlightOffer {
  score: number
  label: string
  labelColor: string
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

function stopsPenalty(stops: number): number {
  if (stops === 0) return 1.0
  if (stops === 1) return 0.5
  return 0.1
}

export function scoreOffers(offers: FlightOffer[]): ScoredOffer[] {
  if (offers.length === 0) return []

  const prices = offers.map((o) => o.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const durations = offers.map((o) => o.outbound.durationMinutes + o.inbound.durationMinutes)
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)

  return offers.map((offer) => {
    const totalDuration = offer.outbound.durationMinutes + offer.inbound.durationMinutes
    const maxStops = Math.max(offer.outbound.stops, offer.inbound.stops)

    const priceScore = (1 - normalize(offer.price, minPrice, maxPrice)) * 40
    const durationScore = (1 - normalize(totalDuration, minDuration, maxDuration)) * 35
    const stopsScore = ((stopsPenalty(offer.outbound.stops) + stopsPenalty(offer.inbound.stops)) / 2) * 25

    const score = Math.round(priceScore + durationScore + stopsScore)

    // Handle labels
    let label = ''
    let labelColor = ''
    if (score >= 90) {
      label = 'Top Pick'
      labelColor = 'cyan'
    } else if (score >= 75) {
      label = 'Great Value'
      labelColor = 'blue'
    } else if (score >= 60) {
      label = 'Good Option'
      labelColor = 'violet'
    } else if (maxStops === 0) {
      label = 'Nonstop'
      labelColor = 'green'
    }

    return { ...offer, score, label, labelColor }
  })
}

export function getBestOfferPerDestination(
  allOffers: FlightOffer[]
): Map<string, ScoredOffer> {
  const byDest = new Map<string, FlightOffer[]>()
  for (const o of allOffers) {
    const arr = byDest.get(o.destination) ?? []
    arr.push(o)
    byDest.set(o.destination, arr)
  }

  const result = new Map<string, ScoredOffer>()
  for (const [dest, offers] of byDest) {
    const scored = scoreOffers(offers)
    const best = scored.sort((a, b) => b.score - a.score)[0]
    if (best) result.set(dest, best)
  }
  return result
}
