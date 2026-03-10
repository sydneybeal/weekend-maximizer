import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import airportsRouter from './routes/airports.js'
import flightsRouter from './routes/flights.js'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: Boolean(process.env.AMADEUS_API_KEY),
    baseUrl: process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com',
  })
})

app.use('/api/airports', airportsRouter)
app.use('/api/flights', flightsRouter)

app.listen(PORT, () => {
  console.log(`\n🛫  Weekend Maximizer API running on http://localhost:${PORT}`)
  if (!process.env.AMADEUS_API_KEY) {
    console.warn('  ⚠️  AMADEUS_API_KEY is not set. Copy .env.example → .env and add your credentials.')
  }
})
