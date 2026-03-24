import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RefreshCw, X } from 'lucide-react'
import { cn } from './lib/utils.js'
import { DashboardHeader } from './components/layout/DashboardHeader.js'
import { StarField } from './components/StarField.js'
import { CitySearchInput, AddedCity } from './components/panels/CitySearchInput.js'
import { TripConfigurator } from './components/panels/TripConfigurator.js'
import { SearchControls } from './components/panels/SearchControls.js'
import { ResultsGrid } from './components/results/ResultsGrid.js'
import { DestinationDrawer } from './components/modals/DestinationDrawer.js'
import { PriceComparisonChart } from './components/visualizations/PriceComparisonChart.js'
import { DurationChart } from './components/visualizations/DurationChart.js'
import { GlassCard, SectionLabel } from './components/ui/GlassCard.js'
import { useSearchStore, getSelectedOriginCodes, getSelectedDestCodes } from './hooks/useSearchStore.js'
import { useFlightSearch } from './hooks/useFlightSearch.js'
import type { SearchedCity } from './types/airports.js'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

function AppInner() {
  const {
    origins,
    destinations,
    searchMonths,
    tripNights,
    departureDay,
    setOrigins,
    setDestinations,
    toggleOriginAirport,
    toggleDestAirport,
    hasSearched,
    markSearched,
  } = useSearchStore()

  const [searchEnabled, setSearchEnabled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const originCodes = getSelectedOriginCodes(origins)
  const destCodes   = getSelectedDestCodes(destinations)

  // One triplet per origin × destination × month
  const triplets = useMemo(
    () =>
      originCodes.flatMap((origin) =>
        destCodes.flatMap((destination) =>
          searchMonths.map((month) => ({ origin, destination, month }))
        )
      ),
    [originCodes, destCodes, searchMonths]
  )

  const { resultsByDestination, isLoading, progress, completedSearches, totalSearches } =
    useFlightSearch({ triplets, tripNights, departureDay, enabled: searchEnabled })

  // Auto-disable once all queries resolve
  useEffect(() => {
    if (searchEnabled && !isLoading && completedSearches === totalSearches && totalSearches > 0) {
      setSearchEnabled(false)
    }
  }, [searchEnabled, isLoading, completedSearches, totalSearches])

  // Dirty tracking
  const lastSearchedParamsRef = useRef('')
  const currentParamsKey = [originCodes.join(','), destCodes.join(','), searchMonths.join(','), tripNights, departureDay].join('|')
  const isDirty = hasSearched && currentParamsKey !== lastSearchedParamsRef.current

  const handleSearch = useCallback(() => {
    markSearched()
    lastSearchedParamsRef.current = currentParamsKey
    setSearchEnabled(false)
    setSidebarOpen(false)
    requestAnimationFrame(() => setSearchEnabled(true))
  }, [markSearched, currentParamsKey])

  const handleAddOrigin    = useCallback((c: SearchedCity) => setOrigins([...origins, c]),            [origins, setOrigins])
  const handleRemoveOrigin = useCallback((id: string)      => setOrigins(origins.filter((c) => c.id !== id)), [origins, setOrigins])
  const handleAddDest      = useCallback((c: SearchedCity) => setDestinations([...destinations, c]),  [destinations, setDestinations])
  const handleRemoveDest   = useCallback((id: string)      => setDestinations(destinations.filter((c) => c.id !== id)), [destinations, setDestinations])

  const hasResults = resultsByDestination.some((r) => r.offers.length > 0)

  return (
    <div className="min-h-screen flex flex-col">
      <StarField />
      <DashboardHeader onMenuClick={() => setSidebarOpen(o => !o)} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={cn(
          "absolute md:relative z-40 h-full w-80 shrink-0 border-r border-white/[0.06] bg-navy-950/90 backdrop-blur-xl flex flex-col overflow-hidden transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Mobile close button */}
          <button
            className="absolute top-3 right-3 z-10 md:hidden p-1.5 rounded-lg glass text-white/50 hover:text-white/80 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-4 border-b border-white/5 shrink-0">
            <SearchControls
              onSearch={handleSearch}
              isLoading={isLoading}
              progress={progress}
              completedSearches={completedSearches}
              totalSearches={totalSearches}
              isDirty={isDirty}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <GlassCard className="p-4 space-y-3">
              <SectionLabel>Flying From</SectionLabel>
              <CitySearchInput
                placeholder="Add a city (e.g. Philadelphia)"
                onCityResolved={handleAddOrigin}
                existingCities={origins}
                onRemoveCity={handleRemoveOrigin}
                maxCities={10}
              />
              {origins.map((city) => (
                <AddedCity key={city.id} city={city} onRemove={handleRemoveOrigin} onToggleAirport={toggleOriginAirport} />
              ))}
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <SectionLabel>Destinations</SectionLabel>
              <CitySearchInput
                placeholder="Add a destination (e.g. London)"
                onCityResolved={handleAddDest}
                existingCities={destinations}
                onRemoveCity={handleRemoveDest}
                maxCities={10}
              />
              {destinations.map((city) => (
                <AddedCity key={city.id} city={city} onRemove={handleRemoveDest} onToggleAirport={toggleDestAirport} />
              ))}
            </GlassCard>

            <GlassCard className="p-4">
              <TripConfigurator />
            </GlassCard>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {!hasSearched && <WelcomeHero />}

          {hasSearched && isDirty && hasResults && (
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-electric-amber/20 bg-electric-amber/5">
              <RefreshCw className="w-4 h-4 text-electric-amber shrink-0" />
              <p className="text-sm text-white/60">
                Selections changed.{' '}
                <button onClick={handleSearch} className="text-electric-amber font-medium underline underline-offset-2">
                  Refresh results
                </button>
              </p>
            </div>
          )}

          {hasSearched && (
            <ResultsGrid results={resultsByDestination} isLoading={isLoading} />
          )}

          {hasResults && !isDirty && resultsByDestination.some((r) => r.bestOffer) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PriceComparisonChart results={resultsByDestination} />
              <DurationChart results={resultsByDestination} />
            </div>
          )}
        </main>
      </div>

      <DestinationDrawer />
    </div>
  )
}

function WelcomeHero() {
  const steps = [
    { num: '01', label: 'Add Cities',  desc: 'Origins + destinations' },
    { num: '02', label: 'Set Nights',  desc: '3, 4, or 5 nights' },
    { num: '03', label: 'Pick Months', desc: 'Which months to scan' },
    { num: '04', label: 'Search',      desc: 'Best deals surface' },
  ]

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center gap-8 sm:gap-10">
      {/* Icon with rings */}
      <div className="relative flex items-center justify-center">
        <div className="ring-breathe absolute w-36 h-36 rounded-full border border-electric-blue/15" />
        <div className="ring-breathe absolute w-24 h-24 rounded-full border border-electric-cyan/20" style={{ animationDelay: '1.5s' }} />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-blue/25 to-electric-cyan/25 border border-electric-blue/30 flex items-center justify-center shadow-lg shadow-electric-blue/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-electric-cyan" style={{ transform: 'rotate(-45deg)' }}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <div className="absolute -inset-1 rounded-2xl bg-electric-blue/15 blur-lg -z-10" />
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-3">
        <p className="text-[11px] font-mono text-electric-cyan/50 uppercase tracking-[0.25em]">
          [ Mission Briefing ]
        </p>
        <h2
          className="text-3xl sm:text-5xl text-white leading-none"
          style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: '0.04em' }}
        >
          FIND YOUR NEXT ESCAPE
        </h2>
        <p className="text-white/35 max-w-sm mx-auto leading-relaxed text-sm font-light">
          Scan origins and destinations across months — the best deals surface automatically.
        </p>
      </div>

      {/* Steps */}
      <div className="flex gap-3 flex-wrap justify-center">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className="glass-card rounded-xl px-5 py-4 w-36 text-left">
              <p className="text-[10px] font-mono text-electric-cyan/40 mb-2 tracking-widest">{s.num}</p>
              <p
                className="text-sm text-white leading-tight"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.04em' }}
              >
                {s.label}
              </p>
              <p className="text-[11px] text-white/30 mt-0.5 font-light">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="text-white/10 text-lg font-mono">›</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
