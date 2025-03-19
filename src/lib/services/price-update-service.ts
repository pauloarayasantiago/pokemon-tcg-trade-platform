import createServerSupabaseClient from '../supabase-server';
import { Database } from '../database.types';
import * as PokemonTcgApi from './pokemon-tcg-api';
import { SupabaseClient } from '@supabase/supabase-js';

// Define a more specific type for the PostgrestFilterBuilder with the filter methods
interface PostgrestFilterBuilder<T> {
  select: (columns: string) => any;
  eq: (column: string, value: any) => any;
  gt: (column: string, value: number) => PostgrestFilterBuilder<T>;
  gte: (column: string, value: number) => PostgrestFilterBuilder<T>;
  lt: (column: string, value: number) => PostgrestFilterBuilder<T>;
  lte: (column: string, value: number) => PostgrestFilterBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => any;
  limit: (count: number) => any;
  not: (column: string, operator: string, value: any) => any;
}

// Define interfaces for the queue system
interface PriceUpdateQueueItem {
  cardId: string;
  cardName: string;
  setId: string;
  priority: 'high' | 'medium' | 'low';
  currentPrice: number | null;
  lastUpdated: string | null;
}

interface PriceUpdateQueueStats {
  queuedItems: number;
  highPriorityItems: number;
  mediumPriorityItems: number;
  lowPriorityItems: number;
  estimatedTimeToComplete: number; // in minutes
}

interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
  cooldownPeriod: number; // in milliseconds
}

/**
 * Logger utility for consistent logging
 */
class Logger {
  constructor(private context: string) {}
  
  info(message: string) {
    console.log(`[${this.context}] [INFO] ${message}`);
  }
  
  error(message: string, error?: any) {
    console.error(`[${this.context}] [ERROR] ${message}`, error || '');
  }
  
  warn(message: string) {
    console.warn(`[${this.context}] [WARN] ${message}`);
  }
}

/**
 * Service to handle price updates for Pokemon TCG cards
 */
export class PriceUpdateService {
  private static logger = new Logger('PriceUpdateService');
  private static updateQueue: PriceUpdateQueueItem[] = [];
  private static isProcessing: boolean = false;
  private static lastRequestTime: number = 0;
  
  // Rate limit configuration
  private static readonly rateLimits: RateLimitConfig = {
    requestsPerMinute: 30, // Adjust based on API limits
    burstSize: 5,
    cooldownPeriod: 2000 // 2 seconds between bursts
  };
  
  /**
   * Update prices for cards based on priority tier
   * @param tier Priority tier ('high', 'medium', 'low', 'all')
   * @param limit Maximum number of cards to update
   * @param supabaseClient Optional Supabase client
   */
  static async updatePricesByTier(
    tier: 'high' | 'medium' | 'low' | 'all' = 'all',
    limit: number = 50,
    supabaseClient?: SupabaseClient
  ): Promise<{
    cardsProcessed: number;
    successfulUpdates: number;
    failedUpdates: number;
    results: any[];
  }> {
    try {
      this.logger.info(`Starting price update for tier: ${tier}, limit: ${limit}`);
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Create query based on tier
      let query = supabase.from('cards');
      
      // Apply tier filtering with proper type casting
      let filteredQuery: any;
      if (tier === 'high') {
        // High priority: Cards with tcg_price > 50
        filteredQuery = (query as unknown as PostgrestFilterBuilder<any>).gt('tcg_price', 50);
      } else if (tier === 'medium') {
        // Medium priority: Cards with tcg_price between 10 and 50
        filteredQuery = (query as unknown as PostgrestFilterBuilder<any>).gte('tcg_price', 10);
        filteredQuery = filteredQuery.lte('tcg_price', 50);
      } else if (tier === 'low') {
        // Low priority: Cards with tcg_price < 10
        filteredQuery = (query as unknown as PostgrestFilterBuilder<any>).lt('tcg_price', 10);
      } else {
        // Default: All cards
        filteredQuery = query;
      }
      
      // Get cards to update, prioritizing those that haven't been updated recently
      const { data: cards, error } = await filteredQuery
        .select('id, name, set_id, tcg_price, price_updated_at')
        .order('price_updated_at', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      
      if (!cards || cards.length === 0) {
        this.logger.info('No cards found matching the criteria');
        return {
          cardsProcessed: 0,
          successfulUpdates: 0,
          failedUpdates: 0,
          results: []
        };
      }
      
      this.logger.info(`Found ${cards.length} cards to update prices for`);
      
      // Update prices for each card
      const results = [];
      for (const card of cards) {
        try {
          // Fetch current price from Pokemon TCG API
          const { data: apiCard } = await PokemonTcgApi.getCardById(card.id);
          
          if (!apiCard) {
            this.logger.warn(`Card not found in TCG API: ${card.id}`);
            results.push({
              cardId: card.id,
              cardName: card.name,
              setId: card.set_id,
              error: 'Card not found in TCG API',
              success: false
            });
            continue;
          }
          
          // Get price from API response
          const oldPrice = card.tcg_price;
          const newPrice = this.getPrice(apiCard);
          
          // Skip update if price is null
          if (newPrice === null) {
            this.logger.warn(`No price available for card ${card.id}`);
            results.push({
              cardId: card.id,
              cardName: card.name,
              setId: card.set_id,
              oldPrice,
              newPrice: null,
              error: 'No price available from API',
              success: false
            });
            continue;
          }
          
          // Update the card price in database
          const { error: updateError } = await supabase
            .from('cards')
            .update({
              tcg_price: newPrice,
              price_updated_at: new Date().toISOString()
            })
            .eq('id', card.id);
          
          if (updateError) throw updateError;
          
          results.push({
            cardId: card.id,
            cardName: card.name,
            setId: card.set_id,
            oldPrice,
            newPrice,
            priceChange: newPrice - (oldPrice || 0),
            priceChangePercent: oldPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
            success: true
          });
          
          this.logger.info(`Updated price for ${card.name}: $${oldPrice} -> $${newPrice}`);
        } catch (error: any) {
          this.logger.error(`Failed to update price for card ${card.id}`, error);
          results.push({
            cardId: card.id,
            cardName: card.name,
            setId: card.set_id,
            error: error.message,
            success: false
          });
        }
      }
      
      return {
        cardsProcessed: cards.length,
        successfulUpdates: results.filter(r => r.success).length,
        failedUpdates: results.filter(r => !r.success).length,
        results
      };
    } catch (error: any) {
      this.logger.error(`Price update failed`, error);
      throw error;
    }
  }
  
  /**
   * Schedule price updates based on priority tiers
   * High value cards are updated more frequently than low value cards
   * @param supabaseClient Optional Supabase client
   */
  static async scheduleUpdates(supabaseClient?: SupabaseClient): Promise<{
    queueStats: PriceUpdateQueueStats;
    message: string;
  }> {
    try {
      this.logger.info('Starting scheduled price updates');
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Get cards that need updates, ordered by last update time
      const { data: cards, error } = await supabase
        .from('cards')
        .select('id, name, set_id, tcg_price, price_updated_at')
        .order('price_updated_at', { ascending: true });
      
      if (error) throw error;
      
      if (!cards || cards.length === 0) {
        return {
          queueStats: {
            queuedItems: 0,
            highPriorityItems: 0,
            mediumPriorityItems: 0,
            lowPriorityItems: 0,
            estimatedTimeToComplete: 0
          },
          message: 'No cards found for updating'
        };
      }
      
      // Convert cards to queue items with priorities
      const queueItems: PriceUpdateQueueItem[] = cards.map(card => ({
        cardId: card.id,
        cardName: card.name,
        setId: card.set_id,
        currentPrice: card.tcg_price,
        lastUpdated: card.price_updated_at,
        priority: this.determinePriority(card.tcg_price)
      }));
      
      // Add cards to the update queue
      await this.addToUpdateQueue(queueItems);
      
      // Get queue statistics
      const queueStats = this.getQueueStats();
      
      return {
        queueStats,
        message: `Successfully queued ${queueItems.length} cards for price updates`
      };
    } catch (error: any) {
      this.logger.error('Scheduled price updates failed', error);
      throw error;
    }
  }
  
  /**
   * Determine the priority tier for a card based on its price
   * @param price Card's current price
   */
  private static determinePriority(price: number | null): 'high' | 'medium' | 'low' {
    if (!price) return 'low';
    
    if (price > 50) return 'high';
    if (price >= 10) return 'medium';
    return 'low';
  }
  
  /**
   * Get the price of a card from the TCG API response
   * @param card Card data from TCG API
   * @returns Price as a number or null if not available
   */
  private static getPrice(card: any): number | null {
    try {
      if (!card || !card.tcgplayer || !card.tcgplayer.prices) {
        return null;
      }
      
      const prices = card.tcgplayer.prices;
      
      // Try to get the most relevant price based on card type
      if (prices.normal && prices.normal.market) {
        return prices.normal.market;
      } else if (prices.holofoil && prices.holofoil.market) {
        return prices.holofoil.market;
      } else if (prices.reverseHolofoil && prices.reverseHolofoil.market) {
        return prices.reverseHolofoil.market;
      } else if (prices.firstEdition && prices.firstEdition.market) {
        return prices.firstEdition.market;
      } else if (prices.unlimited && prices.unlimited.market) {
        return prices.unlimited.market;
      }
      
      // If no market price is available, try to get the mid price
      for (const variant in prices) {
        if (prices[variant].mid) {
          return prices[variant].mid;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting card price:', error);
      return null;
    }
  }
  
  /**
   * Get statistics about price update status
   * @param supabaseClient Optional Supabase client
   */
  static async getPriceUpdateStats(supabaseClient?: SupabaseClient): Promise<{
    totalCards: number;
    cardsWithPrices: number;
    cardsWithoutPrices: number;
    highValueCards: number;
    mediumValueCards: number;
    lowValueCards: number;
    lastUpdated: {
      oldest: string | null;
      newest: string | null;
      averageAgeInDays: number;
    };
  }> {
    try {
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Get total card count
      const { count: totalCards, error: countError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Get count of cards with prices
      const { count: cardsWithPrices, error: priceError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .not('tcg_price', 'is', null);
      
      if (priceError) throw priceError;
      
      // Get high value cards count
      const { count: highValueCards, error: highError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .gt('tcg_price', 50);
      
      if (highError) throw highError;
      
      // Get medium value cards count
      const { count: mediumValueCards, error: mediumError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .gte('tcg_price', 10)
        .lte('tcg_price', 50);
      
      if (mediumError) throw mediumError;
      
      // Get low value cards count
      const { count: lowValueCards, error: lowError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .lt('tcg_price', 10)
        .not('tcg_price', 'is', null);
      
      if (lowError) throw lowError;
      
      // Get oldest and newest price update timestamps
      const { data: updateStats, error: updateError } = await supabase
        .from('cards')
        .select('price_updated_at')
        .not('price_updated_at', 'is', null)
        .order('price_updated_at', { ascending: true });
      
      if (updateError) throw updateError;
      
      let oldestUpdate = null;
      let newestUpdate = null;
      let averageAgeInDays = 0;
      
      if (updateStats && updateStats.length > 0) {
        oldestUpdate = updateStats[0].price_updated_at;
        newestUpdate = updateStats[updateStats.length - 1].price_updated_at;
        
        // Calculate average age in days
        const now = new Date();
        const totalAgeInMs = updateStats.reduce((sum, card) => {
          const updateDate = new Date(card.price_updated_at);
          return sum + (now.getTime() - updateDate.getTime());
        }, 0);
        
        averageAgeInDays = Math.round((totalAgeInMs / updateStats.length) / (1000 * 60 * 60 * 24));
      }
      
      return {
        totalCards: totalCards || 0,
        cardsWithPrices: cardsWithPrices || 0,
        cardsWithoutPrices: (totalCards || 0) - (cardsWithPrices || 0),
        highValueCards: highValueCards || 0,
        mediumValueCards: mediumValueCards || 0,
        lowValueCards: lowValueCards || 0,
        lastUpdated: {
          oldest: oldestUpdate,
          newest: newestUpdate,
          averageAgeInDays
        }
      };
    } catch (error: any) {
      this.logger.error('Error getting price update stats', error);
      throw error;
    }
  }

  /**
   * Add cards to the price update queue
   * @param cards Array of cards to add to the queue
   */
  static async addToUpdateQueue(cards: PriceUpdateQueueItem[]): Promise<void> {
    try {
      this.logger.info(`Adding ${cards.length} cards to update queue`);
      
      // Filter out duplicates
      const existingCardIds = new Set(this.updateQueue.map(item => item.cardId));
      const newCards = cards.filter(card => !existingCardIds.has(card.cardId));
      
      // Add new cards to queue
      this.updateQueue.push(...newCards);
      
      // Sort queue by priority and last update time
      this.sortQueue();
      
      this.logger.info(`Added ${newCards.length} new cards to queue. Total queue size: ${this.updateQueue.length}`);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error: any) {
      this.logger.error('Failed to add cards to update queue', error);
      throw error;
    }
  }

  /**
   * Sort the update queue by priority and last update time
   */
  private static sortQueue(): void {
    const priorityWeight = {
      high: 3,
      medium: 2,
      low: 1
    };
    
    this.updateQueue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by last update time (older updates first)
      const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return aTime - bTime;
    });
  }

  /**
   * Process the update queue while respecting rate limits
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    this.logger.info('Starting queue processing');
    
    try {
      const supabase = await createServerSupabaseClient();
      
      while (this.updateQueue.length > 0) {
        // Check rate limits
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimits.cooldownPeriod) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimits.cooldownPeriod - timeSinceLastRequest));
        }
        
        // Process a burst of updates
        const burst = this.updateQueue.splice(0, this.rateLimits.burstSize);
        const results = await Promise.all(burst.map(card => this.updateSingleCard(card, supabase)));
        
        // Log results
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        this.logger.info(`Processed ${burst.length} cards: ${successful} successful, ${failed} failed`);
        
        this.lastRequestTime = Date.now();
        
        // Add cooldown between bursts
        await new Promise(resolve => setTimeout(resolve, this.rateLimits.cooldownPeriod));
      }
    } catch (error: any) {
      this.logger.error('Error processing queue', error);
    } finally {
      this.isProcessing = false;
      this.logger.info('Queue processing completed');
    }
  }

  /**
   * Update a single card's price
   */
  private static async updateSingleCard(
    card: PriceUpdateQueueItem,
    supabase: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch current price from Pokemon TCG API
      const { data: apiCard } = await PokemonTcgApi.getCardById(card.cardId);
      
      if (!apiCard) {
        throw new Error('Card not found in TCG API');
      }
      
      const newPrice = this.getPrice(apiCard);
      
      if (newPrice === null) {
        throw new Error('No price available from API');
      }
      
      // Update the card price in database
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          tcg_price: newPrice,
          price_updated_at: new Date().toISOString()
        })
        .eq('id', card.cardId);
      
      if (updateError) throw updateError;
      
      this.logger.info(`Updated price for ${card.cardName}: $${card.currentPrice} -> $${newPrice}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to update price for card ${card.cardId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current queue statistics
   */
  static getQueueStats(): PriceUpdateQueueStats {
    const highPriority = this.updateQueue.filter(item => item.priority === 'high').length;
    const mediumPriority = this.updateQueue.filter(item => item.priority === 'medium').length;
    const lowPriority = this.updateQueue.filter(item => item.priority === 'low').length;
    
    // Estimate time based on rate limits and queue size
    const totalRequests = this.updateQueue.length;
    const requestsPerMinute = this.rateLimits.requestsPerMinute;
    const estimatedMinutes = Math.ceil(totalRequests / requestsPerMinute);
    
    return {
      queuedItems: this.updateQueue.length,
      highPriorityItems: highPriority,
      mediumPriorityItems: mediumPriority,
      lowPriorityItems: lowPriority,
      estimatedTimeToComplete: estimatedMinutes
    };
  }
} 