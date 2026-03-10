import { Router } from 'express'
import { searchCities, searchNearbyAirports } from '../lib/amadeus.js'
import type { CityResult } from '../../src/types/airports.js'

const router = Router()

// GET /api/airports/search?q=Philadelphia
// Returns a list of cities matching the keyword, each with nearby airports
router.get('/search', async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  try {
    const cities = await searchCities(q)
    if (cities.length === 0) {
      return res.json([])
    }

    // Only fetch airports for the top match to stay under Amadeus rate limits
    const top = cities[0]
    const airports = await searchNearbyAirports(
      top.geoCode.latitude,
      top.geoCode.longitude,
      150
    )
    const result: CityResult = {
      keyword: q,
      name: top.address.cityName,
      code: top.iataCode,
      country: top.address.countryCode,
      lat: top.geoCode.latitude,
      lon: top.geoCode.longitude,
      airports,
    }

    return res.json([result])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[airports/search]', message)
    return res.status(500).json({ error: message })
  }
})

export default router
