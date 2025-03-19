'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import createBrowserSupabaseClient from '@/lib/supabase-browser';

export const dynamic = 'force-dynamic';

interface Card {
  id: string;
  name: string;
  supertype: string | null;
  rarity: string | null;
  image_small: string | null;
  image_large: string | null;
  set_id: string;
  set?: {
    name: string;
    symbol_url: string | null;
  };
  variations?: Array<any>;
  [key: string]: any;
}

interface SetDistribution {
  setId: string;
  setName: string;
  count: number;
  percentage: number;
}

export default function AdvancedTestCardsPage() {
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [rarityTypes, setRarityTypes] = useState<any[]>([]);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [generations, setGenerations] = useState<Set<number>>(new Set());
  const [eras, setEras] = useState<Set<string>>(new Set());
  const [setDistribution, setSetDistribution] = useState<{[key: string]: number}>({});
  const [setNames, setSetNames] = useState<{[key: string]: string}>({});
  const [totalCards, setTotalCards] = useState<number>(0);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(20);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available sets for filter dropdown
        const { data: setsData } = await supabase
          .from('sets')
          .select('id, name')
          .order('release_date', { ascending: false });
        
        if (setsData) setSets(setsData);
        
        // Fetch available rarity types for filter dropdown
        const { data: rarityData } = await supabase
          .from('rarity_types')
          .select('*')
          .order('name');
        
        if (rarityData) setRarityTypes(rarityData);
        
        // Build query with filters
        let query = supabase
          .from('cards')
          .select(`
            *,
            set:sets(name, symbol_url),
            variations:card_variations(*)
          `);
        
        // Apply filters based on search params
        const set = searchParams?.get('set');
        if (set) {
          query = query.eq('set_id', set);
        }
        
        const rarity = searchParams?.get('rarity');
        if (rarity) {
          query = query.eq('rarity', rarity);
        }
        
        const type = searchParams?.get('type');
        if (type && type !== 'all') {
          // For types, we need to filter on the array
          query = query.contains('types', [type]);
        }
        
        const generation = searchParams?.get('generation');
        if (generation) {
          query = query.eq('pokemon_generation', parseInt(generation));
        }
        
        const era = searchParams?.get('era');
        if (era) {
          query = query.eq('card_era', era);
        }
        
        const search = searchParams?.get('search');
        if (search) {
          // Search by name
          query = query.ilike('name', `%${search}%`);
        }
        
        // Get the limit from search params or use default
        const paramLimit = searchParams?.get('limit');
        const newLimit = paramLimit ? parseInt(paramLimit) : 20;
        setLimit(newLimit);
        
        // Execute final query with limit
        const { data: cardsData, error: cardsError } = await query
          .order('last_sync_at', { ascending: false })
          .limit(newLimit);
        
        if (cardsError) throw cardsError;
        if (cardsData) {
          setCards(cardsData as Card[]);
          
          // Calculate set distribution
          const distribution = cardsData.reduce((acc, card) => {
            const setId = card.set_id;
            acc[setId] = (acc[setId] || 0) + 1;
            return acc;
          }, {} as {[key: string]: number});
          setSetDistribution(distribution);
          
          // Get set names for display
          const names = {} as {[key: string]: string};
          cardsData.forEach(card => {
            if (card.set && card.set.name && !names[card.set_id]) {
              names[card.set_id] = card.set.name;
            }
          });
          setSetNames(names);
          
          // Calculate set distribution
          const distArray = Object.entries(distribution).map(([setId, data]) => ({
            setId,
            setName: names[setId] || setId,
            count: data,
            percentage: (data / cardsData.length) * 100
          }));
          
          // Sort by count (descending)
          distArray.sort((a, b) => b.count - a.count);
          
          setTotalCards(cardsData.length);
          
          // Extract selected sets
          const selectedSetIds = distArray.map(item => item.setId);
          setSelectedSets(selectedSetIds);
        }
        
        // Fetch all cards for metadata
        const { data: allCards } = await supabase
          .from('cards')
          .select('types, pokemon_generation, card_era')
          .limit(500);
        
        if (allCards) {
          const typesSet = new Set<string>();
          const generationsSet = new Set<number>();
          const erasSet = new Set<string>();
          
          // Extract metadata for filters
          allCards.forEach((card) => {
            // Add types
            if (card.types) {
              card.types.forEach((type: string) => typesSet.add(type));
            }
            
            // Add generations
            if (card.pokemon_generation) {
              generationsSet.add(card.pokemon_generation);
            }
            
            // Add eras
            if (card.card_era) {
              erasSet.add(card.card_era);
            }
          });
          
          setTypes(typesSet);
          setGenerations(generationsSet);
          setEras(erasSet);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams]);

  // Calculate set distribution metrics
  const distributionMetrics = useMemo(() => {
    if (Object.keys(setDistribution).length === 0) return null;
    
    const totalSets = Object.keys(setDistribution).length;
    const totalCards = Object.values(setDistribution).reduce((sum, count) => sum + count, 0);
    const maxCardsInSet = Math.max(...Object.values(setDistribution));
    const minCardsInSet = Math.min(...Object.values(setDistribution));
    const avgCardsPerSet = totalCards / totalSets;
    
    return {
      totalSets,
      totalCards,
      maxCardsInSet,
      minCardsInSet,
      avgCardsPerSet: Math.round(avgCardsPerSet * 10) / 10
    };
  }, [setDistribution]);

  const getPriceFreshnessIndicator = (updatedAt: string) => {
    const now = new Date();
    const updateDate = new Date(updatedAt);
    const diffDays = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      // Less than 1 day - fresh
      return (
        <span className="flex items-center text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Today
        </span>
      );
    } else if (diffDays < 7) {
      // Less than a week - relatively fresh
      return (
        <span className="flex items-center text-xs text-blue-600">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
          {diffDays} day{diffDays !== 1 ? 's' : ''} ago
        </span>
      );
    } else if (diffDays < 30) {
      // Less than a month - somewhat stale
      return (
        <span className="flex items-center text-xs text-yellow-600">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
          {Math.floor(diffDays / 7)} week{Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago
        </span>
      );
    } else {
      // More than a month - stale
      return (
        <span className="flex items-center text-xs text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          {Math.floor(diffDays / 30)} month{Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago
        </span>
      );
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Database Test Error</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error:</p>
          <p>{error.message}</p>
        </div>
        <p>
          Make sure you've completed these steps:
        </p>
        <ol className="list-decimal ml-6 mt-4 space-y-2">
          <li>Added your Supabase credentials to .env.local</li>
          <li>Added your Pokemon TCG API key to .env.local</li>
          <li>Run the test API endpoint at <Link href="/api/test-pokemon-tcg" className="text-blue-600 underline">api/test-pokemon-tcg</Link> to sync data</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Advanced Pokemon Card Browser</h1>
        <div className="flex space-x-4">
          <Link href="/test-cards" className="text-blue-600 underline">
            Simple View
          </Link>
          <Link 
            href="/api/test-pokemon-tcg" 
            className="text-green-600 underline"
            target="_blank"
          >
            Sync Cards API
          </Link>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      )}

      {!loading && (!cards || cards.length === 0) && (
        <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">No cards found</p>
          <p>Try adjusting your filters or sync more cards first.</p>
          <Link 
            href="/api/test-pokemon-tcg" 
            className="mt-2 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Sync Pokemon Cards
          </Link>
        </div>
      )}

      {/* Set Distribution Visualization */}
      {!loading && cards.length > 0 && distributionMetrics && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Set Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-md font-medium mb-2">Distribution Metrics</h3>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium">Total Cards:</span> {distributionMetrics.totalCards}</li>
                <li><span className="font-medium">Total Sets:</span> {distributionMetrics.totalSets}</li>
                <li><span className="font-medium">Average Cards per Set:</span> {distributionMetrics.avgCardsPerSet}</li>
                <li><span className="font-medium">Most Cards in a Set:</span> {distributionMetrics.maxCardsInSet}</li>
                <li><span className="font-medium">Fewest Cards in a Set:</span> {distributionMetrics.minCardsInSet}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Sets in Results</h3>
              <div className="max-h-40 overflow-y-auto">
                {Object.entries(setDistribution)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([setId, count]) => (
                    <div key={setId} className="flex items-center mb-2">
                      <div className="w-full">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{setNames[setId] || setId}</span>
                          <span>{count} cards</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / distributionMetrics.maxCardsInSet) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          {/* Quick set sync links */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(setDistribution).map(setId => (
                <a 
                  key={setId}
                  href={`/api/test-pokemon-tcg?mode=cards-only&setId=${setId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                >
                  Sync {setNames[setId] || setId}
                </a>
              ))}
              <a 
                href="/api/test-pokemon-tcg?mode=full"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
              >
                Sync All Sets
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Filter Form */}
      <div className="bg-gray-100 p-4 rounded-lg mb-8">
        <form action="" method="get" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Set Filter */}
          <div>
            <label htmlFor="set" className="block text-sm font-medium text-gray-700 mb-1">Set</label>
            <select
              name="set"
              id="set"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('set') || ''}
            >
              <option value="">All Sets</option>
              {sets?.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div>
            <label htmlFor="rarity" className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
            <select
              name="rarity"
              id="rarity"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('rarity') || ''}
            >
              <option value="">All Rarities</option>
              {rarityTypes?.map(rarity => (
                <option key={rarity.name} value={rarity.name}>
                  {rarity.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              id="type"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('type') || ''}
            >
              <option value="">All Types</option>
              {Array.from(types).sort().map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Generation Filter */}
          <div>
            <label htmlFor="generation" className="block text-sm font-medium text-gray-700 mb-1">Generation</label>
            <select
              name="generation"
              id="generation"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('generation') || ''}
            >
              <option value="">All Generations</option>
              {Array.from(generations).sort().map(gen => (
                <option key={gen} value={gen}>
                  Generation {gen}
                </option>
              ))}
            </select>
          </div>

          {/* Era Filter */}
          <div>
            <label htmlFor="era" className="block text-sm font-medium text-gray-700 mb-1">Card Era</label>
            <select
              name="era"
              id="era"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('era') || ''}
            >
              <option value="">All Eras</option>
              {Array.from(eras).sort().map(era => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
          </div>

          {/* Limit Control */}
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">Results Limit</label>
            <select
              name="limit"
              id="limit"
              className="w-full rounded-md border-gray-300 shadow-sm"
              defaultValue={searchParams?.get('limit') || '20'}
            >
              <option value="10">10 cards</option>
              <option value="20">20 cards</option>
              <option value="50">50 cards</option>
              <option value="100">100 cards</option>
            </select>
          </div>

          {/* Search by name */}
          <div className="md:col-span-3 lg:col-span-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex">
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Card name..."
                className="flex-1 rounded-l-md border-gray-300 shadow-sm"
                defaultValue={searchParams?.get('search') || ''}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {!loading && cards?.map((card) => (
          <div key={card.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="relative">
              <Image
                src={card.image_small || '/images/card-placeholder.png'}
                alt={card.name}
                width={250}
                height={350}
                className="w-full object-contain"
              />
              {card.set?.symbol_url && (
                <div className="absolute top-2 right-2 w-6 h-6">
                  <Image
                    src={card.set.symbol_url}
                    alt={card.set.name}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{card.name}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{card.rarity}</span>
                <span>{card.set?.name}</span>
              </div>
              {card.tcg_price && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Price: </span>
                  <span className={`${card.tcg_price > 20 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                    ${card.tcg_price.toFixed(2)}
                  </span>
                  
                  {/* Price Freshness Indicator */}
                  {card.price_updated_at && (
                    <div className="mt-1 flex items-center">
                      <span className="text-xs mr-1">Updated:</span>
                      {getPriceFreshnessIndicator(card.price_updated_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {!loading && cards.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {cards.length} of {totalCards} cards
            </span>
            <Link
              href={`/api/test-pokemon-tcg?${selectedSets.length === 1 ? `setId=${selectedSets[0]}` : ''}`}
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
              target="_blank"
            >
              Sync {selectedSets.length === 1 ? `Set ${selectedSets[0]}` : 'All Sets'}
            </Link>
            <Link
              href="/api/test-price-update"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              target="_blank"
            >
              Update Prices
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 