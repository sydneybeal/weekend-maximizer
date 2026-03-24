import { Router } from 'express'
import { searchFlights } from '../lib/amadeus.js'

const router = Router()

// POST /api/flights/search
// Body: { origin, destination, month, tripNights }
router.post('/search', async (req, res) => {
  const { origin, destination, month, tripNights, departureDay } = req.body as {
    origin?: string
    destination?: string
    month?: string
    tripNights?: number
    departureDay?: number
  }

  if (!origin || !destination || !month) {
    return res.status(400).json({ error: 'origin, destination, and month are required' })
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month must be YYYY-MM' })
  }

  try {
    const offers = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      month,
      tripNights: tripNights ?? 4,
      departureDay: departureDay ?? 5,
    })
    return res.json({ origin, destination, offers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[flights] ${origin}→${destination} ${month}:`, message)
    return res.json({ origin, destination, offers: [], error: message })
  }
})

export default router
