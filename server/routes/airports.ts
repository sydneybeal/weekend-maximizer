import { Router } from 'express'
import { searchAirportsByCity } from '../lib/airports-data.js'
import type { CityResult } from '../../src/types/airports.js'

const router = Router()

// GET /api/airports/search?q=Philadelphia
// Pure static lookup — no external API calls, instant response.
router.get('/search', (req, res) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  const result = searchAirportsByCity(q)
  if (!result) {
    return res.json([])
  }

  const cityResult: CityResult = {
    keyword: q,
    name: result.name,
    code: result.code,
    country: result.country,
    lat: result.lat,
    lon: result.lon,
    airports: result.airports,
  }

  return res.json([cityResult])
})

export default router
