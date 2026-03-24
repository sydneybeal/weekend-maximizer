import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import airportsRouter from './routes/airports.js'
import flightsRouter from './routes/flights.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173' }))
}
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: Boolean(process.env.AMADEUS_CLIENT_ID),
    baseUrl: process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com',
  })
})

app.use('/api/airports', airportsRouter)
app.use('/api/flights', flightsRouter)

if (isProd) {
  const clientDir = path.join(__dirname, '../../../dist/client')
  app.use(express.static(clientDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`\n🛫  Weekend Maximizer API running on http://localhost:${PORT}`)
  if (!process.env.AMADEUS_CLIENT_ID) {
    console.warn('  ⚠️  AMADEUS_CLIENT_ID is not set. Copy .env.example → .env and add your credentials.')
  }
})
