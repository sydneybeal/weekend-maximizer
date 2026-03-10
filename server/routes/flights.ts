import { Router } from 'express'
import { searchFlights } from '../lib/amadeus.js'

const router = Router()

// POST /api/flights/search
// Body: { origin, destination, departureDate, returnDate, adults?, nonStop? }
router.post('/search', async (req, res) => {
  const { origin, destination, departureDate, returnDate, adults, nonStop } = req.body as {
    origin?: string
    destination?: string
    departureDate?: string
    returnDate?: string
    adults?: number
    nonStop?: boolean
  }

  if (!origin || !destination || !departureDate || !returnDate) {
    return res.status(400).json({
      error: 'origin, destination, departureDate, and returnDate are required',
    })
  }

  // Basic date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(departureDate) || !dateRegex.test(returnDate)) {
    return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' })
  }

  try {
    const offers = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      adults: adults ?? 1,
      nonStop: nonStop ?? false,
      max: 10,
    })

    return res.json({ origin, destination, offers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[flights/search] ${origin}→${destination}:`, message)

    // Return empty results rather than erroring the whole search
    return res.json({ origin, destination, offers: [], error: message })
  }
})

export default router
