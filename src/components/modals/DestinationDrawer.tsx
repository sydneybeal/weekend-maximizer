import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin } from 'lucide-react'
import { useResultsStore } from '../../hooks/useResultsStore.js'
import { FlightDetailRow } from './FlightDetailRow.js'
import { scoreOffers } from '../../lib/scoring.js'
import { airportCityMap } from '../../lib/utils.js'

export function DestinationDrawer() {
  const { drawerDestination, drawerOffers, closeDrawer } = useResultsStore()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeDrawer])

  const scored = scoreOffers(drawerOffers).sort((a, b) => b.score - a.score)
  const city = drawerDestination ? airportCityMap(drawerDestination) : ''

  return (
    <AnimatePresence>
      {drawerDestination && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-navy-900 border-l border-white/8 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-electric-cyan" />
                <div>
                  <h2 className="text-lg font-bold text-white">{city}</h2>
                  <p className="text-[12px] text-white/40 font-mono">{drawerDestination}</p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Subheader */}
            <div className="px-6 py-3 border-b border-white/5">
              <p className="text-sm text-white/40">
                {scored.length} flight option{scored.length !== 1 ? 's' : ''} found · sorted by best match
              </p>
            </div>

            {/* Offers list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {scored.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <p>No flights available for this route</p>
                </div>
              ) : (
                scored.map((offer, i) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <FlightDetailRow offer={offer} rank={i + 1} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
