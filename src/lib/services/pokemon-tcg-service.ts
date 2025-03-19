import createServerSupabaseClient from '../supabase-server';
import { Database } from '../database.types';
import * as PokemonTcgApi from './pokemon-tcg-api';
import { SupabaseClient } from '@supabase/supabase-js';

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

  debug(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] [DEBUG] ${message}`);
    }
  }
}

/**
 * Configuration for retry mechanism
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Set synchronization status
 */
interface SetSyncStatus {
  id: string;
  name: string;
  total: number;
  syncedCount: number;
  lastSyncAt: string | null;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Service to interact with the Pokemon TCG API and sync data with our database
 */
export class PokemonTcgService {
  private static logger = new Logger('PokemonTcgService');
  private logger = new Logger('PokemonTcgService');
  private supabase: SupabaseClient;
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  };

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient as SupabaseClient;
  }

  /**
   * Initialize supabase client if not provided in constructor
   */
  private async initSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient();
    }
    return this.supabase;
  }

  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param config Retry configuration
   * @returns Result of the function
   */
  private static async retry<T>(fn: () => Promise<T>, config: RetryConfig = this.defaultRetryConfig): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Operation failed (attempt ${attempt}/${config.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (attempt < config.maxRetries) {
          // Calculate delay with exponential backoff and jitter
          const delay = Math.min(
            config.maxDelay,
            config.baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random())
          );
          
          this.logger.debug(`Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Calculate sync priority for a set based on inventory status
   * @param setId Set ID
   * @param supabase Supabase client
   * @returns Priority level 'high', 'medium', or 'low'
   */
  private static async calculateSyncPriority(setId: string, supabase: SupabaseClient): Promise<'high' | 'medium' | 'low'> {
    try {
      // Check if set has cards in inventory
      const { count, error } = await supabase
        .from('inventory_cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', setId);
      
      if (error) throw error;
      
      if (count && count > 50) return 'high';
      if (count && count > 10) return 'medium';
      return 'low';
    } catch (error) {
      this.logger.error(`Error calculating sync priority for set ${setId}`, error);
      return 'low'; // Default to low priority on error
    }
  }

  /**
   * Get all sets from the API and store them in the database
   */
  static async syncSets(supabaseClient?: SupabaseClient): Promise<void> {
    try {
      this.logger.info('Starting set sync...');
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Fetch all sets from the Pokemon TCG API with retry mechanism
      const { data: sets } = await this.retry(() => PokemonTcgApi.getAllSets());
      
      // Transform API sets to match our database schema
      const transformedSets = sets.map((set: any) => ({
        id: set.id,
        name: set.name,
        series: set.series,
        release_date: set.releaseDate,
        total: set.total,
        logo_url: set.images.logo,
        symbol_url: set.images.symbol,
        last_sync_at: new Date().toISOString()
      }));
      
      // Insert sets into the database using upsert (update if exists, insert if not)
      const { error } = await supabase
        .from('sets')
        .upsert(transformedSets, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });
      
      if (error) {
        throw error;
      }
      
      this.logger.info(`Successfully synced ${transformedSets.length} sets`);
    } catch (error) {
      this.logger.error('Error syncing sets', error);
      throw error;
    }
  }
  
  /**
   * Get sets that need synchronization and prioritize them
   * @param supabaseClient Supabase client
   * @returns Prioritized list of sets
   */
  static async getSetsToSync(supabaseClient?: SupabaseClient): Promise<SetSyncStatus[]> {
    try {
      this.logger.info('Getting sets that need synchronization...');
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Get all sets from database
      const { data: sets, error } = await supabase
        .from('sets')
        .select('*')
        .order('last_sync_at', { ascending: true }); // Oldest first
      
      if (error) throw error;
      
      if (!sets || sets.length === 0) {
        this.logger.warn('No sets found in database. Syncing sets first...');
        await this.syncSets(supabase);
        return this.getSetsToSync(supabase); // Recursive call after sync
      }
      
      // Get synced card counts for each set
      const setStatuses: SetSyncStatus[] = [];
      
      for (const set of sets) {
        // Get count of cards for this set
        const { count, error: countError } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('set_id', set.id);
        
        if (countError) throw countError;
        
        // Calculate priority based on inventory status
        const priority = await this.calculateSyncPriority(set.id, supabase);
        
        setStatuses.push({
          id: set.id,
          name: set.name,
          total: set.total,
          syncedCount: count || 0,
          lastSyncAt: set.last_sync_at,
          priority
        });
      }
      
      // Sort by priority and completion status
      return setStatuses.sort((a, b) => {
        // First, sort by priority (high > medium > low)
        if (a.priority !== b.priority) {
          if (a.priority === 'high') return -1;
          if (a.priority === 'medium' && b.priority === 'low') return -1;
          return 1;
        }
        
        // Then by completion percentage (lowest first)
        const aCompletionPct = a.syncedCount / a.total;
        const bCompletionPct = b.syncedCount / b.total;
        
        if (aCompletionPct !== bCompletionPct) {
          return aCompletionPct - bCompletionPct;
        }
        
        // Finally by last sync date (oldest first)
        const aDate = a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0;
        const bDate = b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0;
        return aDate - bDate;
      });
    } catch (error) {
      this.logger.error('Error getting sets to sync', error);
      throw error;
    }
  }
  
  /**
   * Sync all sets that need synchronization with prioritization
   * @param batchSize Number of sets to sync in one batch
   * @param supabaseClient Supabase client
   */
  static async syncAllSets(batchSize: number = 5, supabaseClient?: SupabaseClient): Promise<void> {
    try {
      this.logger.info(`Starting full synchronization with batch size ${batchSize}...`);
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Get prioritized sets to sync
      const setsToSync = await this.getSetsToSync(supabase);
      
      this.logger.info(`Found ${setsToSync.length} sets to sync`);
      
      // Process sets in batches to respect API rate limits
      for (let i = 0; i < setsToSync.length; i += batchSize) {
        const batch = setsToSync.slice(i, i + batchSize);
        
        this.logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(setsToSync.length / batchSize)}`);
        
        // Process batch in parallel
        await Promise.all(batch.map(async (set) => {
          try {
            this.logger.info(`Syncing set ${set.name} (${set.id}) - Priority: ${set.priority}`);
            await this.syncCardsBySet(set.id, supabase);
          } catch (error) {
            this.logger.error(`Error syncing set ${set.id}`, error);
            // Continue with other sets even if one fails
          }
        }));
        
        // Wait between batches to respect API rate limits
        if (i + batchSize < setsToSync.length) {
          this.logger.info('Waiting between batches to respect API rate limits...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      this.logger.info('Full synchronization completed');
    } catch (error) {
      this.logger.error('Error in full synchronization', error);
      throw error;
    }
  }
  
  /**
   * Get cards for a specific set and store them in the database
   */
  static async syncCardsBySet(setId: string, supabaseClient?: SupabaseClient): Promise<void> {
    try {
      this.logger.info(`Starting card sync for set ${setId}...`);
      
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Check if we already have cards for this set
      const { count, error: countError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', setId);
      
      if (countError) {
        throw countError;
      }
      
      this.logger.info(`Found ${count} existing cards for set ${setId}`);
      
      // Fetch cards from the Pokemon TCG API for this set with retry mechanism
      const { data: cards } = await this.retry(() => PokemonTcgApi.getCardsBySet(setId));
      
      // Get existing cards to determine which ones need updates
      const { data: existingCards, error: existingError } = await supabase
        .from('cards')
        .select('id, tcg_price, price_updated_at')
        .eq('set_id', setId);
      
      if (existingError) {
        throw existingError;
      }
      
      // Create a map of existing cards for quick lookup
      const existingCardMap = new Map();
      if (existingCards && existingCards.length > 0) {
        existingCards.forEach((card: { id: string; tcg_price: number | null; price_updated_at: string }) => {
          existingCardMap.set(card.id, {
            tcg_price: card.tcg_price,
            price_updated_at: card.price_updated_at
          });
        });
      }
      
      // Transform API cards to match our database schema
      const transformedCards = cards.map((card: any) => {
        const existingCard = existingCardMap.get(card.id);
        const newPrice = this.getPrice(card);
        
        // If the card exists, only update the price if it has changed
        // Otherwise, keep other data the same
        return {
          id: card.id,
          name: card.name,
          supertype: card.supertype,
          types: card.types || null,
          set_id: card.set.id,
          number: card.number,
          rarity: card.rarity,
          rarity_code: this.getRarityCode(card.rarity),
          card_era: this.getCardEra(card.set.series),
          language: 'English', // API cards are in English by default
          image_small: card.images.small,
          image_large: card.images.large,
          pokemon_generation: this.getPokemonGeneration(card.nationalPokedexNumbers?.[0]),
          // Only update price if it's different or doesn't exist
          tcg_price: existingCard && newPrice === existingCard.tcg_price ? existingCard.tcg_price : newPrice,
          price_updated_at: existingCard && newPrice === existingCard.tcg_price ? 
            existingCard.price_updated_at : new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        };
      });
      
      // Insert cards into the database using upsert with batch processing to avoid timeouts
      const batchSize = 100;
      for (let i = 0; i < transformedCards.length; i += batchSize) {
        const batch = transformedCards.slice(i, i + batchSize);
        this.logger.info(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedCards.length / batchSize)} for set ${setId}`);
        
        const { error } = await supabase
          .from('cards')
          .upsert(batch, {
            onConflict: 'id',
            ignoreDuplicates: false,
          });
        
        if (error) {
          throw error;
        }
      }
      
      // Process card variations
      let successCount = 0;
      let errorCount = 0;
      
      for (const card of cards) {
        try {
          await this.processCardVariations(card, supabase);
          successCount++;
        } catch (error) {
          this.logger.error(`Error processing variations for card ${card.id}`, error);
          errorCount++;
        }
      }
      
      // Update set last_sync_at timestamp
      await supabase
        .from('sets')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', setId);
      
      this.logger.info(`Successfully synced ${transformedCards.length} cards for set ${setId}`);
      this.logger.info(`Processed variations: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      this.logger.error(`Error syncing cards for set ${setId}`, error);
      throw error;
    }
  }
  
  /**
   * Process card variations based on card data
   */
  private static async processCardVariations(card: any, supabaseClient: any): Promise<void> {
    try {
      // First, check if this card already has variations to avoid duplicates
      const { data: existingVariations, error: checkError } = await supabaseClient
        .from('card_variations')
        .select('variation_type, treatment')
        .eq('card_id', card.id);
      
      if (checkError) {
        console.error(`Error checking existing variations for card ${card.id}:`, checkError);
        throw checkError;
      }
      
      // Create a map of existing variations for quick lookup
      const existingVariationMap = new Map();
      if (existingVariations && existingVariations.length > 0) {
        existingVariations.forEach((v: { variation_type: string; treatment: string | null }) => {
          const key = `${v.variation_type}:${v.treatment || 'null'}`;
          existingVariationMap.set(key, true);
        });
      }
      
      // Function to check if a variation already exists
      const variationExists = (type: string, treatment: string | null) => {
        const key = `${type}:${treatment || 'null'}`;
        return existingVariationMap.has(key);
      };
      
      // Function to safely add a variation if it doesn't exist
      const addVariationIfNeeded = async (variation: any) => {
        if (!variationExists(variation.variation_type, variation.treatment)) {
          const { error } = await supabaseClient
            .from('card_variations')
            .insert(variation);
          
          if (error) {
            console.warn(`Error adding variation for card ${card.id}:`, error);
          }
        }
      };
      
      // Base variation for the normal version of the card
      const baseVariation = {
        card_id: card.id,
        variation_type: 'Normal',
        treatment: null,
        holofoil_pattern: null,
        is_special_rarity: false,
        special_rarity_type: null,
        image_url: card.images.small,
        tcg_api_price_key: 'normal'
      };
      
      // Add the base variation to the database if it doesn't exist
      await addVariationIfNeeded(baseVariation);
      
      // Check if the card has a holofoil version
      if (card.tcgplayer?.prices?.holofoil) {
        const holoVariation = {
          card_id: card.id,
          variation_type: 'Holofoil',
          treatment: null,
          holofoil_pattern: this.getHolofoilPattern(card.set.series),
          is_special_rarity: false,
          special_rarity_type: null,
          image_url: card.images.small, // Same image for now
          tcg_api_price_key: 'holofoil'
        };
        
        await addVariationIfNeeded(holoVariation);
      }
      
      // Check if the card has a reverse holofoil version
      if (card.tcgplayer?.prices?.reverseHolofoil) {
        const reverseHoloVariation = {
          card_id: card.id,
          variation_type: 'Reverse Holofoil',
          treatment: null,
          holofoil_pattern: this.getHolofoilPattern(card.set.series),
          is_special_rarity: false,
          special_rarity_type: null,
          image_url: card.images.small, // Same image for now
          tcg_api_price_key: 'reverseHolofoil'
        };
        
        await addVariationIfNeeded(reverseHoloVariation);
      }
      
      // Process other special variations based on card subtypes
      if (card.subtypes) {
        for (const subtype of card.subtypes) {
          if (['V', 'VMAX', 'VSTAR', 'EX', 'GX', 'V-UNION'].includes(subtype)) {
            const specialVariation = {
              card_id: card.id,
              variation_type: subtype,
              treatment: this.getSpecialTreatment(card),
              holofoil_pattern: null,
              is_special_rarity: true,
              special_rarity_type: this.getSpecialRarityType(card, subtype),
              image_url: card.images.small,
              tcg_api_price_key: 'normal' // Default to normal price
            };
            
            await addVariationIfNeeded(specialVariation);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing variations for card ${card.id}:`, error);
      // Continue processing other cards even if one fails
    }
  }
  
  /**
   * Get the rarity code from a rarity string
   */
  private static getRarityCode(rarity: string | undefined): string | null {
    if (!rarity) return null;
    
    const rarityMap: Record<string, string> = {
      'Common': 'C',
      'Uncommon': 'U',
      'Rare': 'R',
      'Rare Holo': 'RH',
      'Rare Ultra': 'UR',
      'Rare Holo EX': 'EX',
      'Rare Holo GX': 'GX',
      'Rare Holo V': 'V',
      'Rare Holo VMAX': 'VMAX',
      'Rare Holo VSTAR': 'VSTAR',
      'Rare Secret': 'SR',
      'Rare Rainbow': 'RR',
      'Promo': 'PR',
      'Amazing Rare': 'AR',
      'Rare Shiny': 'SH',
      'Rare Shining': 'SL',
      'Classic Collection': 'CC',
      'Trainer Gallery': 'TG'
    };
    
    return rarityMap[rarity] || rarity;
  }
  
  /**
   * Get the card era based on the set series
   */
  private static getCardEra(series: string | undefined): string | null {
    if (!series) return null;
    
    if (series.includes('Base') || series.includes('Fossil') || series.includes('Jungle') || series.includes('Team Rocket')) {
      return 'Base';
    } else if (series.includes('E-Series') || series.includes('Expedition') || series.includes('Aquapolis') || series.includes('Skyridge')) {
      return 'E-Series';
    } else if (series.includes('EX')) {
      return 'EX Series';
    } else if (series.includes('Diamond & Pearl')) {
      return 'Diamond & Pearl';
    } else if (series.includes('Black & White')) {
      return 'Black & White';
    } else if (series.includes('XY')) {
      return 'XY';
    } else if (series.includes('Sun & Moon')) {
      return 'Sun & Moon';
    } else if (series.includes('Sword & Shield')) {
      return 'Sword & Shield';
    } else if (series.includes('Scarlet & Violet')) {
      return 'Scarlet & Violet';
    }
    
    return series;
  }
  
  /**
   * Get the Pokemon generation based on the national pokedex number
   */
  private static getPokemonGeneration(dexNumber: number | undefined): number | null {
    if (!dexNumber) return null;
    
    if (dexNumber <= 151) return 1;
    if (dexNumber <= 251) return 2;
    if (dexNumber <= 386) return 3;
    if (dexNumber <= 493) return 4;
    if (dexNumber <= 649) return 5;
    if (dexNumber <= 721) return 6;
    if (dexNumber <= 809) return 7;
    if (dexNumber <= 898) return 8;
    if (dexNumber <= 1008) return 9;
    
    return null;
  }
  
  /**
   * Get the price from a card's TCGPlayer data
   */
  private static getPrice(card: any): number | null {
    // Try to get the normal price first
    const normalPrice = card.tcgplayer?.prices?.normal?.market;
    if (normalPrice) return normalPrice;
    
    // If no normal price, try holofoil
    const holoPrice = card.tcgplayer?.prices?.holofoil?.market;
    if (holoPrice) return holoPrice;
    
    // If no holofoil price, try reverse holofoil
    const reverseHoloPrice = card.tcgplayer?.prices?.reverseHolofoil?.market;
    if (reverseHoloPrice) return reverseHoloPrice;
    
    // If no market prices are available, fall back to mid prices
    const normalMid = card.tcgplayer?.prices?.normal?.mid;
    if (normalMid) return normalMid;
    
    const holoMid = card.tcgplayer?.prices?.holofoil?.mid;
    if (holoMid) return holoMid;
    
    const reverseHoloMid = card.tcgplayer?.prices?.reverseHolofoil?.mid;
    if (reverseHoloMid) return reverseHoloMid;
    
    return null;
  }
  
  /**
   * Get the holofoil pattern based on the set series
   */
  private static getHolofoilPattern(series: string | undefined): string | null {
    if (!series) return null;
    
    if (series.includes('Base') || 
        series.includes('Fossil') || 
        series.includes('Jungle') || 
        series.includes('E-Series') ||
        series.includes('Ex Series')) {
      return 'Cosmos';
    } else if (series.includes('Black & White')) {
      return 'Tinsel';
    } else if (series.includes('XY')) {
      return 'Sheen';
    } else if (series.includes('Sun & Moon')) {
      return 'Water-Web';
    } else if (series.includes('Sword & Shield')) {
      return 'Vertical Stripes';
    } else if (series.includes('Scarlet & Violet')) {
      return 'Light-reflecting Border';
    }
    
    return null;
  }
  
  /**
   * Get the special treatment of a card based on its data
   */
  private static getSpecialTreatment(card: any): string | null {
    // If the card has the 'Full Art' subtype
    if (card.subtypes?.includes('Full Art')) {
      return 'Full Art';
    }
    
    // If the card has the 'Alt Art' subtype (not standard but sometimes used)
    if (card.subtypes?.includes('Alt Art') || card.subtypes?.includes('Alternate Art')) {
      return 'Alt Art';
    }
    
    // If the card is a rainbow rare
    if (card.rarity?.includes('Rainbow')) {
      return 'Rainbow Rare';
    }
    
    // If the card is a secret rare
    if (card.rarity?.includes('Secret')) {
      return 'Secret Rare';
    }
    
    return null;
  }
  
  /**
   * Get the special rarity type for special cards
   */
  private static getSpecialRarityType(card: any, subtype: string): string | null {
    // Standard special rarity types by card subtype
    const specialRarityMap: Record<string, string> = {
      'V': 'Ultra Rare',
      'VMAX': 'Ultra Rare',
      'VSTAR': 'Ultra Rare',
      'EX': 'Ultra Rare',
      'GX': 'Ultra Rare',
      'V-UNION': 'Ultra Rare',
    };
    
    // Check if it's a secret rare
    if (card.rarity?.includes('Secret')) {
      return 'Secret Rare';
    }
    
    // Check if it's a rainbow rare
    if (card.rarity?.includes('Rainbow')) {
      return 'Rainbow Rare';
    }
    
    // Check for other special rarities
    if (card.rarity?.includes('Amazing Rare')) {
      return 'Amazing Rare';
    }
    
    if (card.rarity?.includes('Shiny')) {
      return 'Shiny Rare';
    }
    
    if (card.rarity?.includes('Illustration Rare') || card.subtypes?.includes('Illustration Rare')) {
      return 'Illustration Rare';
    }
    
    if (card.rarity?.includes('Special Illustration Rare') || card.subtypes?.includes('Special Illustration Rare')) {
      return 'Special Illustration Rare';
    }
    
    // Default to the standard mapping
    return specialRarityMap[subtype] || null;
  }
  
  /**
   * Update prices for all cards in inventory from TCG API
   */
  static async updatePricesForInventoryCards(supabaseClient?: SupabaseClient): Promise<void> {
    try {
      // Get Supabase client for server if not provided
      const supabase = supabaseClient || await createServerSupabaseClient();
      
      // Get distinct card_ids from inventory
      const { data: inventoryCards, error: fetchError } = await supabase
        .from('inventory_cards')
        .select('card_id')
        .order('card_id')
        .limit(500); // Limit to avoid API rate limits
      
      if (fetchError) throw fetchError;
      
      if (!inventoryCards || inventoryCards.length === 0) {
        console.log('No inventory cards to update prices for');
        return;
      }
      
      // Get unique card IDs
      const uniqueCardIds = [...new Set(inventoryCards.map(item => item.card_id))];
      
      console.log(`Updating prices for ${uniqueCardIds.length} unique cards in inventory`);
      
      // Fetch each card individually from TCG API and update price
      for (const cardId of uniqueCardIds) {
        try {
          const { data: card } = await PokemonTcgApi.getCardById(cardId);
          
          if (!card) {
            console.warn(`Card not found in TCG API: ${cardId}`);
            continue;
          }
          
          // Update card price in our database
          const { error: updateError } = await supabase
            .from('cards')
            .update({
              tcg_price: this.getPrice(card),
              price_updated_at: new Date().toISOString(),
            })
            .eq('id', cardId);
          
          if (updateError) {
            console.error(`Error updating price for card ${cardId}:`, updateError);
          }
        } catch (cardError) {
          console.error(`Error fetching card ${cardId} from TCG API:`, cardError);
        }
      }
      
      console.log('Price update complete');
    } catch (error) {
      console.error('Error updating inventory card prices:', error);
      throw error;
    }
  }

  /**
   * Synchronize all sets metadata from Pokemon TCG API
   * Returns statistics about the sync operation
   */
  async syncAllSets(): Promise<{
    totalSets: number;
    syncedAt: string;
    success: boolean;
  }> {
    try {
      const supabase = await this.initSupabase();
      
      // Use the static method implementation
      await PokemonTcgService.syncSets(supabase);
      
      // Get updated set count
      const { count: totalSets, error: countError } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        totalSets: totalSets || 0,
        syncedAt: new Date().toISOString(),
        success: true
      };
    } catch (error: any) {
      this.logger.error('Failed to sync all sets', error);
      throw error;
    }
  }

  /**
   * Get all sets from database
   */
  async getAllSets(): Promise<any[]> {
    try {
      const supabase = await this.initSupabase();
      
      const { data: sets, error } = await supabase
        .from('sets')
        .select('id, name, release_date')
        .order('release_date', { ascending: false });
      
      if (error) throw error;
      
      return sets || [];
    } catch (error: any) {
      this.logger.error('Failed to get all sets', error);
      throw error;
    }
  }

  /**
   * Synchronize cards for a specific set
   * @param setId Set identifier
   * @param options Sync options
   */
  async syncCardsForSet(
    setId: string,
    options: { limit?: number } = {}
  ): Promise<{
    setId: string;
    totalCards: number;
    totalVariations: number;
    syncedAt: string;
    success: boolean;
  }> {
    try {
      const supabase = await this.initSupabase();
      
      // Use the static method implementation
      await PokemonTcgService.syncCardsBySet(setId, supabase);
      
      // Get card count for this set
      const { count: totalCards, error: cardError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', setId);
      
      if (cardError) throw cardError;
      
      // Get variation count for this set
      const { count: totalVariations, error: varError } = await supabase
        .from('card_variations')
        .select('*', { count: 'exact', head: true })
        .like('card_id', `${setId}-%`);
      
      if (varError) throw varError;
      
      return {
        setId,
        totalCards: totalCards || 0,
        totalVariations: totalVariations || 0,
        syncedAt: new Date().toISOString(),
        success: true
      };
    } catch (error: any) {
      this.logger.error(`Failed to sync cards for set ${setId}`, error);
      return {
        setId,
        totalCards: 0,
        totalVariations: 0,
        syncedAt: new Date().toISOString(),
        success: false
      };
    }
  }
} 