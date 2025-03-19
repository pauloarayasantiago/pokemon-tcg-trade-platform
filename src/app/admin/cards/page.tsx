'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

interface Card {
  id: string;
  name: string;
  set_id: string;
  set_name: string;
  rarity: string | null;
  number: string;
  tcg_price: number | null;
  price_updated_at: string | null;
  image_small: string | null;
  image_large: string | null;
}

interface CardBrowserState {
  cards: Card[];
  sets: Array<{id: string, name: string, series: string | null}>;
  rarities: string[];
  loading: boolean;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  error: string | null;
  filters: {
    search: string;
    setId: string | null;
    rarity: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    sortField: string;
    sortOrder: 'asc' | 'desc';
  };
}

export default function AdminCardBrowser() {
  const [state, setState] = useState<CardBrowserState>({
    cards: [],
    sets: [],
    rarities: [],
    loading: true,
    totalCount: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    error: null,
    filters: {
      search: '',
      setId: null,
      rarity: null,
      minPrice: null,
      maxPrice: null,
      sortField: 'name',
      sortOrder: 'asc'
    }
  });
  
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  useEffect(() => {
    // Debounce search input
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);
  
  useEffect(() => {
    // Update filters when debounced search changes
    if (state.filters.search !== debouncedSearch) {
      setState(prev => ({
        ...prev,
        page: 1, // Reset to first page on search change
        filters: {
          ...prev.filters,
          search: debouncedSearch
        }
      }));
    }
  }, [debouncedSearch, state.filters.search]);
  
  useEffect(() => {
    fetchCards();
  }, [state.page, state.filters]);
  
  // Debug effect to log rarities when they change
  useEffect(() => {
    if (state.rarities.length > 0) {
      console.log('AdminCardBrowser - Current rarities in state:', state.rarities.length);
      console.log('AdminCardBrowser - First few rarities:', state.rarities.slice(0, 5));
      console.log('AdminCardBrowser - Last few rarities:', state.rarities.slice(-5));
    }
  }, [state.rarities]);
  
  const fetchCards = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Build query parameters from state
      const params = new URLSearchParams({
        page: state.page.toString(),
        limit: state.limit.toString(),
        search: state.filters.search || '',
        sort: state.filters.sortField,
        order: state.filters.sortOrder
      });
      
      if (state.filters.setId) {
        params.append('set', state.filters.setId);
      }
      
      if (state.filters.rarity) {
        params.append('rarity', state.filters.rarity);
      }
      
      if (state.filters.minPrice !== null) {
        params.append('minPrice', state.filters.minPrice.toString());
      }
      
      if (state.filters.maxPrice !== null) {
        params.append('maxPrice', state.filters.maxPrice.toString());
      }
      
      const response = await fetch(`/api/admin/cards?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        console.log('Loaded rarities:', data.rarities?.length || 0, data.rarities);
        setState(prev => ({
          ...prev,
          cards: data.cards,
          sets: data.sets || [],
          rarities: data.rarities || [],
          totalCount: data.totalCount,
          totalPages: data.totalPages,
          loading: false
        }));
      } else {
        throw new Error(data.message || 'Failed to load cards');
      }
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'An error occurred while fetching cards' 
      }));
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > state.totalPages) return;
    setState(prev => ({ ...prev, page: newPage }));
  };
  
  const handleSetFilter = (value: string) => {
    setState(prev => ({
      ...prev,
      page: 1, // Reset to first page on filter change
      filters: {
        ...prev.filters,
        setId: value === 'all' ? null : value
      }
    }));
  };
  
  const handleRarityFilter = (value: string) => {
    setState(prev => ({
      ...prev,
      page: 1, // Reset to first page on filter change
      filters: {
        ...prev.filters,
        rarity: value === 'all' ? null : value
      }
    }));
  };
  
  const handleSortChange = (field: string) => {
    setState(prev => {
      // If clicking on the same field, toggle order
      const newOrder = 
        prev.filters.sortField === field && prev.filters.sortOrder === 'asc' 
          ? 'desc' 
          : 'asc';
          
      return {
        ...prev,
        filters: {
          ...prev.filters,
          sortField: field,
          sortOrder: newOrder
        }
      };
    });
  };
  
  const SortIcon = ({ field }: { field: string }) => {
    if (state.filters.sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {state.filters.sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Card Database</h1>
        <p className="text-muted-foreground">
          Browse, search, and manage cards in the database.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter cards by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Search</label>
                <Input 
                  type="text" 
                  placeholder="Card name..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              
              {/* Set Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Set</label>
                <Select
                  value={state.filters.setId || 'all'}
                  onValueChange={handleSetFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sets</SelectItem>
                    {state.sets.map(set => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Rarity Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Rarity</label>
                <Select
                  value={state.filters.rarity || 'all'}
                  onValueChange={handleRarityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <ScrollArea className="h-[300px] pr-3">
                      <SelectItem value="all">All Rarities</SelectItem>
                      {state.rarities.map(rarity => (
                        <SelectItem key={rarity} value={rarity}>
                          {rarity}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">View</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Results</CardTitle>
              <div className="text-sm text-muted-foreground">
                Showing {state.cards.length} of {state.totalCount} cards
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              // Loading skeleton
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array(10).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded" />
                  ))}
                </div>
              )
            ) : state.error ? (
              // Error state
              <div className="text-center py-8 text-red-500">
                <p>{state.error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={fetchCards}
                >
                  Try Again
                </Button>
              </div>
            ) : state.cards.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <p>No cards found matching your criteria.</p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid view
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {state.cards.map(card => (
                  <div 
                    key={card.id} 
                    className="flex flex-col border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative pt-[140%] bg-muted">
                      {card.image_small ? (
                        <img 
                          src={card.image_small} 
                          alt={card.name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-card flex-grow">
                      <h3 className="font-medium truncate" title={card.name}>
                        {card.name}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {card.set_name} · {card.number}
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="font-medium">
                          {formatPrice(card.tcg_price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {card.rarity || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Table view
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSortChange('name')}>
                        Name <SortIcon field="name" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortChange('set')}>
                        Set <SortIcon field="set" />
                      </TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Rarity</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortChange('price')}>
                        Price <SortIcon field="price" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortChange('updated_at')}>
                        Last Updated <SortIcon field="updated_at" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.cards.map(card => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.name}</TableCell>
                        <TableCell>{card.set_name}</TableCell>
                        <TableCell>{card.number}</TableCell>
                        <TableCell>{card.rarity || 'Unknown'}</TableCell>
                        <TableCell>{formatPrice(card.tcg_price)}</TableCell>
                        <TableCell>{formatDate(card.price_updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Page {state.page} of {state.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={state.page <= 1}
                onClick={() => handlePageChange(state.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={state.page >= state.totalPages}
                onClick={() => handlePageChange(state.page + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 