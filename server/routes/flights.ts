import { Router } from 'express'
import { searchFlights } from '../lib/travelpayouts.js'

const router = Router()

// POST /api/flights/search
// Body: { origin, destination, month, tripNights }
router.post('/search', async (req, res) => {
  const { origin, destination, month, tripNights } = req.body as {
    origin?: string
    destination?: string
    month?: string
    tripNights?: number
  }

  if (!origin || !destination || !month) {
    return res.status(400).json({ error: 'origin, destination, and month are required' })
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month must be YYYY-MM' })
  }

  const rawIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
    ?? req.socket.remoteAddress
    ?? '127.0.0.1'
  // Normalize IPv6 loopback — ::1 contains colons that corrupt the MD5 signature string
  const userIp = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp

  try {
    const offers = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      month,
      tripNights: tripNights ?? 4,
      userIp,
    })
    return res.json({ origin, destination, offers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[flights] ${origin}→${destination} ${month}:`, message)
    return res.json({ origin, destination, offers: [], error: message })
  }
})

export default router
