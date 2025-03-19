import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Logger } from './logger';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export interface CardSearchParams {
  name?: string;
  setId?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  includeSetData?: boolean;
}

interface SearchResult {
  cards: any[];
  totalCount: number;
  executionTimeMs: number;
  query: string;
}

// Simple in-memory cache for search results
interface CacheEntry {
  result: SearchResult;
  timestamp: number;
  queryHash: string;
}

/**
 * Utility for efficient cross-set card searching with query optimization
 */
export class CardSearch {
  private static logger = new Logger('CardSearch');
  private static cache: Map<string, CacheEntry> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;

  /**
   * Search for cards across sets with optimized query building
   * @param params Search parameters
   */
  static async searchCards(params: CardSearchParams): Promise<SearchResult> {
    try {
      const startTime = performance.now();
      
      // Generate a cache key based on the search parameters
      const queryHash = this.generateQueryHash(params);
      
      // Check if we have a cached result
      const cachedEntry = this.getFromCache(queryHash);
      if (cachedEntry) {
        this.logger.info(`Cache hit for query: ${queryHash}`);
        return cachedEntry.result;
      }
      
      this.logger.info(`Searching cards with params: ${JSON.stringify(params)}`);
      
      const supabase = await createServerSupabaseClient();
      
      // Build the base query
      let query = supabase
        .from('cards')
        .select(
          params.includeSetData 
            ? 'id, name, set_id, rarity, tcg_price, price_updated_at, image_small, image_large, sets:set_id(id, name, release_date, symbol_url)'
            : 'id, name, set_id, rarity, tcg_price, price_updated_at, image_small, image_large'
        );
      
      // Apply filters
      query = this.applyFilters(query, params);
      
      // Get the total count first
      const countQuery = structuredClone(query);
      const { count, error: countError } = await countQuery.count();
      
      if (countError) {
        throw countError;
      }
      
      // Apply pagination
      query = query
        .order('tcg_price', { ascending: false })
        .limit(params.limit || 50)
        .range(
          params.offset || 0, 
          (params.offset || 0) + (params.limit || 50) - 1
        );
      
      // Execute the query
      const { data: cards, error } = await query;
      
      if (error) {
        throw error;
      }
      
      const executionTime = performance.now() - startTime;
      
      // Format the result
      const result: SearchResult = {
        cards: cards || [],
        totalCount: count || 0,
        executionTimeMs: Math.round(executionTime),
        query: query.toURL().toString()
      };
      
      // Cache the result
      this.addToCache(queryHash, result);
      
      this.logger.info(`Search completed in ${executionTime.toFixed(2)}ms, found ${result.totalCount} cards`);
      return result;
    } catch (error: any) {
      this.logger.error(`Search failed: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Apply filters to the query based on search parameters
   * @param query Base query
   * @param params Search parameters
   */
  private static applyFilters(
    query: any,
    params: CardSearchParams
  ): any {
    let filteredQuery = query;
    
    // Apply name filter
    if (params.name) {
      filteredQuery = filteredQuery.ilike('name', `%${params.name}%`);
    }
    
    // Apply set filter
    if (params.setId) {
      filteredQuery = filteredQuery.eq('set_id', params.setId);
    }
    
    // Apply rarity filter
    if (params.rarity) {
      filteredQuery = filteredQuery.eq('rarity', params.rarity);
    }
    
    // Apply price range filters
    if (params.minPrice !== undefined) {
      filteredQuery = filteredQuery.gte('tcg_price', params.minPrice);
    }
    
    if (params.maxPrice !== undefined) {
      filteredQuery = filteredQuery.lte('tcg_price', params.maxPrice);
    }
    
    return filteredQuery;
  }
  
  /**
   * Generate a unique hash for the query parameters
   * @param params Search parameters
   */
  private static generateQueryHash(params: CardSearchParams): string {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }
  
  /**
   * Get a cached search result if available and not expired
   * @param queryHash The query hash
   */
  private static getFromCache(queryHash: string): CacheEntry | null {
    const entry = this.cache.get(queryHash);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(queryHash);
      return null;
    }
    
    return entry;
  }
  
  /**
   * Add a search result to the cache
   * @param queryHash The query hash
   * @param result The search result
   */
  private static addToCache(queryHash: string, result: SearchResult): void {
    // Ensure cache doesn't grow too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove the oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort(([_, a], [__, b]) => a.timestamp - b.timestamp)
        [0][0];
      
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(queryHash, {
      result,
      timestamp: Date.now(),
      queryHash
    });
  }
  
  /**
   * Clear the search cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.logger.info('Search cache cleared');
  }
} 