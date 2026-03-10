import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
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
    setOrigins,
    setDestinations,
    toggleOriginAirport,
    toggleDestAirport,
    hasSearched,
    markSearched,
  } = useSearchStore()

  const [searchEnabled, setSearchEnabled] = useState(false)

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
    useFlightSearch({ triplets, tripNights, enabled: searchEnabled })

  // Auto-disable once all queries resolve
  useEffect(() => {
    if (searchEnabled && !isLoading && completedSearches === totalSearches && totalSearches > 0) {
      setSearchEnabled(false)
    }
  }, [searchEnabled, isLoading, completedSearches, totalSearches])

  // Dirty tracking
  const lastSearchedParamsRef = useRef('')
  const currentParamsKey = [originCodes.join(','), destCodes.join(','), searchMonths.join(','), tripNights].join('|')
  const isDirty = hasSearched && currentParamsKey !== lastSearchedParamsRef.current

  const handleSearch = useCallback(() => {
    markSearched()
    lastSearchedParamsRef.current = currentParamsKey
    setSearchEnabled(false)
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
      <DashboardHeader />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-white/5 bg-navy-900/40 backdrop-blur-xl flex flex-col overflow-hidden">
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

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
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
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-electric-blue/20 to-electric-cyan/20 border border-electric-blue/20 flex items-center justify-center">
          <span className="text-4xl">✈️</span>
        </div>
        <div className="absolute -inset-2 bg-electric-blue/10 rounded-3xl blur-xl -z-10" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Find your next escape</h2>
        <p className="text-white/40 max-w-md mx-auto leading-relaxed">
          Add origin and destination cities, pick how many nights and which months to search,
          then hit Search to find the best deals across all your options.
        </p>
      </div>
      <div className="flex gap-4 flex-wrap justify-center">
        {[
          { icon: '📍', label: 'Add cities',   desc: 'Origins + destinations' },
          { icon: '🌙', label: 'Set nights',   desc: '3, 4, or 5 nights' },
          { icon: '📅', label: 'Pick months',  desc: 'Which months to scan' },
          { icon: '🔍', label: 'Hit Search',   desc: 'Best deals surface automatically' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 w-32">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-sm font-semibold text-white mt-2">{s.label}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{s.desc}</p>
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
