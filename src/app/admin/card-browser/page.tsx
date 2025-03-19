'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow, TableHeader, TableHead, TableBody, Table } from '@/components/ui/table';
import { ArrowUpDown, Search, RefreshCw, BarChart2, List, Grid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Card interface to match the expected API response
interface Card {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  image_small?: string | null;
  image_large?: string | null;
  tcg_price?: number | null;
  price_updated_at?: string | null;
  set_id: string;
  set_name: string;
  types?: string[] | null;
  supertype?: string | null;
  pokemon_generation?: number | null;
  card_era?: string | null;
  [key: string]: any;
}

// Set distribution interface for analytics
interface SetDistribution {
  setId: string;
  setName: string;
  count: number;
  percentage: number;
}

export default function CardBrowser() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGeneration, setSelectedGeneration] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Sort states
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Filter options
  const [sets, setSets] = useState<any[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [generations, setGenerations] = useState<number[]>([]);
  const [eras, setEras] = useState<string[]>([]);
  
  // Distribution analytics
  const [setDistribution, setSetDistribution] = useState<SetDistribution[]>([]);
  
  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortField,
        order: sortOrder
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSet && selectedSet !== 'all') params.append('set', selectedSet);
      if (selectedRarity && selectedRarity !== 'all') params.append('rarity', selectedRarity);
      if (selectedType && selectedType !== 'all') params.append('type', selectedType);
      if (selectedGeneration && selectedGeneration !== 'all') params.append('generation', selectedGeneration);
      if (selectedEra && selectedEra !== 'all') params.append('era', selectedEra);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      
      const response = await fetch(`/api/admin/cards?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setCards(data.cards);
        setTotalCards(data.totalCount);
        setTotalPages(data.totalPages);
        
        // Only update these on first load or refresh
        if (sets.length === 0) {
          setSets(data.sets || []);
        }
        
        // Always update rarities to ensure all are displayed
        setRarities(data.rarities || []);
        console.log('Loaded rarities:', data.rarities?.length || 0);
        
        if (types.length === 0 && data.types) {
          setTypes(data.types);
        }
        
        if (generations.length === 0 && data.generations) {
          setGenerations(data.generations);
        }
        
        if (eras.length === 0 && data.eras) {
          setEras(data.eras);
        }
        
        // Calculate set distribution for analytics
        calculateSetDistribution(data.cards);
      } else {
        console.error('Error fetching cards:', data.message);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateSetDistribution = (cards: Card[]) => {
    if (!cards || cards.length === 0) {
      setSetDistribution([]);
      return;
    }
    
    // Count cards by set
    const setCounts: {[key: string]: number} = {};
    const setNames: {[key: string]: string} = {};
    
    cards.forEach(card => {
      setCounts[card.set_id] = (setCounts[card.set_id] || 0) + 1;
      setNames[card.set_id] = card.set_name;
    });
    
    // Convert to array and calculate percentages
    const distArray: SetDistribution[] = Object.entries(setCounts).map(([setId, count]) => ({
      setId,
      setName: setNames[setId] || setId,
      count,
      percentage: (count / cards.length) * 100
    }));
    
    // Sort by count (descending)
    distArray.sort((a, b) => b.count - a.count);
    
    setSetDistribution(distArray);
  };
  
  // Calculate set distribution metrics
  const distributionMetrics = useMemo(() => {
    if (setDistribution.length === 0) return null;
    
    const totalSets = setDistribution.length;
    const totalCardCount = setDistribution.reduce((sum, dist) => sum + dist.count, 0);
    const maxCardsInSet = Math.max(...setDistribution.map(dist => dist.count));
    const minCardsInSet = Math.min(...setDistribution.map(dist => dist.count));
    const avgCardsPerSet = totalCardCount / totalSets;
    
    return {
      totalSets,
      totalCardCount,
      maxCardsInSet,
      minCardsInSet,
      avgCardsPerSet: Math.round(avgCardsPerSet * 10) / 10
    };
  }, [setDistribution]);
  
  useEffect(() => {
    fetchCards();
  }, [page, sortField, sortOrder]);
  
  // Add a new useEffect that runs fetchCards on mount
  useEffect(() => {
    // Initial fetch on component mount
    fetchCards();
  }, []);

  // Debug effect to log rarities when they change
  useEffect(() => {
    if (rarities.length > 0) {
      console.log('Current rarities in state:', rarities.length);
      console.log('First few rarities:', rarities.slice(0, 5));
      console.log('Last few rarities:', rarities.slice(-5));
    }
  }, [rarities]);

  // Debug effect to log cards
  useEffect(() => {
    if (cards.length > 0) {
      console.log('First card object:', JSON.stringify(cards[0], null, 2));
      console.log('Image URLs in first 3 cards:');
      cards.slice(0, 3).forEach(card => {
        console.log(`Card ${card.id}:`, {
          image_small: card.image_small,
          keys: Object.keys(card)
        });
      });
    }
  }, [cards]);
  
  // Test image loading early
  useEffect(() => {
    if (cards.length > 0) {
      const testCard = cards[0];
      console.log('Testing image URL format for first card:');
      console.log('Original image_small:', testCard.image_small);
      console.log('Processed URL:', getCardImageUrl(testCard));
    }
  }, [cards]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchCards();
  };
  
  const handleSort = (field: string) => {
    // If clicking the same field, toggle order
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const handleReset = () => {
    setSearchQuery('');
    setSelectedSet('all');
    setSelectedRarity('all');
    setSelectedType('all');
    setSelectedGeneration('all');
    setSelectedEra('all');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    setSortField('name');
    setSortOrder('asc');
    // Call fetchCards immediately instead of using setTimeout
    fetchCards();
  };
  
  const getPriceFreshnessIndicator = (updatedAt: string) => {
    const now = new Date();
    const updateDate = new Date(updatedAt);
    const diffDays = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      // Less than 1 day - fresh
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Today
        </Badge>
      );
    } else if (diffDays < 7) {
      // Less than a week - relatively fresh
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {diffDays}d ago
        </Badge>
      );
    } else if (diffDays < 30) {
      // Less than a month - somewhat stale
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {Math.floor(diffDays / 7)}w ago
        </Badge>
      );
    } else {
      // More than a month - stale
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {Math.floor(diffDays / 30)}m ago
        </Badge>
      );
    }
  };
  
  // Helper function to get image URL regardless of property name
  const getCardImageUrl = (card: Card): string | null => {
    // Try all possible image field names
    const imageUrl = card.image_small || card.imageSmall || card.small_image || card.smallImage || null;
    console.log(`Image URL for card ${card.id}: ${imageUrl}`);
    
    if (!imageUrl) return null;
    
    // If the image URL doesn't have https://, add it
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return `https://${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Card image component with error handling
  const CardImage = ({ card, className, size = 'small' }: { card: Card, className?: string, size?: 'small' | 'large' }) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = size === 'small' ? getCardImageUrl(card) : (card.image_large || getCardImageUrl(card));
    
    if (!imageUrl || imageError) {
      return (
        <div className={`bg-gray-200 flex items-center justify-center text-gray-500 text-xs ${className}`}>
          No Image
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt={card.name}
        className={className}
        loading="lazy"
        onError={() => {
          console.error('Image failed to load:', imageUrl);
          setImageError(true);
        }}
      />
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Card Browser</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4 mr-1" />
            Grid
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Search card name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="default">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Set</label>
                <Select value={selectedSet} onValueChange={setSelectedSet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any set</SelectItem>
                    {sets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Rarity</label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rarity" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <ScrollArea className="h-[300px] pr-3">
                      <SelectItem value="all">Any rarity</SelectItem>
                      {rarities.map((rarity) => (
                        <SelectItem key={rarity} value={rarity}>
                          {rarity}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Generation</label>
                <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any generation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any generation</SelectItem>
                    {generations.map((gen) => (
                      <SelectItem key={gen} value={gen.toString()}>
                        Generation {gen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Min Price ($)</label>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Price ($)</label>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Results per page</label>
                <Select 
                  value={limit.toString()} 
                  onValueChange={(val) => {
                    setLimit(parseInt(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 cards</SelectItem>
                    <SelectItem value="20">20 cards</SelectItem>
                    <SelectItem value="50">50 cards</SelectItem>
                    <SelectItem value="100">100 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="self-end">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>
              Results
              {!loading && (
                <span className="text-sm font-normal ml-2">
                  ({totalCards} cards, page {page} of {totalPages})
                </span>
              )}
            </span>
            
            {!loading && setDistribution.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'analytics' ? 'table' : 'analytics')}>
                <BarChart2 className="h-4 w-4 mr-2" />
                {viewMode === 'analytics' ? 'Hide' : 'Show'} Analytics
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cards" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="analytics">Set Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cards" className="space-y-4">
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Image</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                          Name
                          {sortField === 'name' && (
                            <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                          )}
                        </TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('set')}>
                          Set
                          {sortField === 'set' && (
                            <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                          )}
                        </TableHead>
                        <TableHead>Rarity</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                          Price
                          {sortField === 'price' && (
                            <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                          )}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('updated_at')}>
                          Updated
                          {sortField === 'updated_at' && (
                            <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          </TableRow>
                        ))
                      ) : cards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No cards found
                          </TableCell>
                        </TableRow>
                      ) : (
                        cards.map((card) => {
                          const imageUrl = getCardImageUrl(card);
                          console.log('Card image URL (table view):', card.id, imageUrl);
                          return (
                            <TableRow key={card.id}>
                              <TableCell>
                                <CardImage
                                  card={card}
                                  className="h-12 w-auto rounded shadow"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{card.name}</TableCell>
                              <TableCell>{card.number}</TableCell>
                              <TableCell>{card.set_name}</TableCell>
                              <TableCell>{card.rarity || 'Unknown'}</TableCell>
                              <TableCell>
                                {card.tcg_price ? (
                                  <span className={card.tcg_price > 10 ? 'text-green-600 font-medium' : ''}>
                                    ${parseFloat(card.tcg_price.toString()).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {card.price_updated_at ? (
                                  getPriceFreshnessIndicator(card.price_updated_at)
                                ) : (
                                  <span className="text-gray-400">Never</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))
                  ) : cards.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      No cards found
                    </div>
                  ) : (
                    cards.map((card) => {
                      const imageUrl = getCardImageUrl(card);
                      console.log('Card image URL (grid view):', card.id, imageUrl);
                      return (
                        <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="relative aspect-[2/3] bg-gray-100 flex items-center justify-center">
                            <CardImage
                              card={card}
                              className="h-full w-full object-contain"
                              size="large"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold truncate">{card.name}</h3>
                            <div className="flex justify-between text-sm text-gray-600 mt-1">
                              <span>{card.rarity || 'Unknown'}</span>
                              <span className="truncate">{card.set_name}</span>
                            </div>
                            {card.tcg_price ? (
                              <div className="mt-2">
                                <span className={`text-sm ${card.tcg_price > 10 ? 'text-green-600 font-bold' : ''}`}>
                                  ${parseFloat(card.tcg_price.toString()).toFixed(2)}
                                </span>
                                
                                {card.price_updated_at && (
                                  <div className="mt-1">
                                    {getPriceFreshnessIndicator(card.price_updated_at)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-gray-400">Price: N/A</div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
              
              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCards)} of {totalCards} cards
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(page - 1, 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(page + 1, totalPages))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics">
              {/* Set Distribution Analytics */}
              {!loading && setDistribution.length > 0 && distributionMetrics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribution Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span className="text-sm font-medium">Total Cards:</span>
                            <span>{distributionMetrics.totalCardCount}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm font-medium">Total Sets:</span>
                            <span>{distributionMetrics.totalSets}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm font-medium">Average Cards per Set:</span>
                            <span>{distributionMetrics.avgCardsPerSet}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm font-medium">Most Cards in a Set:</span>
                            <span>{distributionMetrics.maxCardsInSet}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm font-medium">Fewest Cards in a Set:</span>
                            <span>{distributionMetrics.minCardsInSet}</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Sets in Results</CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-60 overflow-y-auto">
                        {setDistribution.map((dist) => (
                          <div key={dist.setId} className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{dist.setName}</span>
                              <span>{dist.count} cards ({Math.round(dist.percentage)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(dist.count / distributionMetrics.maxCardsInSet) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 