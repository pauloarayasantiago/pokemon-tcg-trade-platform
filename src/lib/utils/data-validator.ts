import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Logger } from './logger';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

interface ValidationError {
  type: string;
  message: string;
  affectedEntities?: string[];
}

interface ValidationWarning {
  type: string;
  message: string;
  affectedEntities?: string[];
}

interface ValidationStats {
  totalSets: number;
  totalCards: number;
  setsWithoutCards: number;
  cardsWithoutPrices: number;
  cardsWithoutImages: number;
  averageCardsPerSet: number;
  oldestPriceUpdate: string | null;
  newestPriceUpdate: string | null;
}

/**
 * Data validation utility for verifying the consistency and quality of card data
 */
export class DataValidator {
  private static logger = new Logger('DataValidator');

  /**
   * Validate all card data in the database for consistency and completeness
   */
  static async validateCardData(): Promise<ValidationResult> {
    const supabase = await createServerSupabaseClient();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const stats: ValidationStats = {
      totalSets: 0,
      totalCards: 0,
      setsWithoutCards: 0,
      cardsWithoutPrices: 0,
      cardsWithoutImages: 0,
      averageCardsPerSet: 0,
      oldestPriceUpdate: null,
      newestPriceUpdate: null
    };

    try {
      this.logger.info('Starting data validation');

      // Get all sets
      const { data: sets, error: setsError } = await supabase
        .from('sets')
        .select('id, name, release_date, cards(count)');

      if (setsError) {
        throw setsError;
      }

      stats.totalSets = sets.length;

      // Check sets without cards
      const setsWithoutCards = sets.filter(set => set.cards.length === 0 || set.cards[0].count === 0);
      stats.setsWithoutCards = setsWithoutCards.length;

      if (setsWithoutCards.length > 0) {
        warnings.push({
          type: 'SETS_WITHOUT_CARDS',
          message: `Found ${setsWithoutCards.length} sets without any cards`,
          affectedEntities: setsWithoutCards.map(set => `${set.id} (${set.name})`)
        });
      }

      // Get all cards using pagination to handle large datasets
      let allCards: any[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase default limit
      let hasMore = true;

      this.logger.info('Fetching all cards using pagination');
      
      while (hasMore) {
        const { data: pagedCards, error: cardsError } = await supabase
          .from('cards')
          .select('id, name, set_id, tcg_price, price_updated_at, image_small, image_large')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (cardsError) {
          throw cardsError;
        }

        if (pagedCards.length > 0) {
          allCards = [...allCards, ...pagedCards];
          this.logger.info(`Fetched page ${page + 1}: ${pagedCards.length} cards, total so far: ${allCards.length}`);
        }
        
        hasMore = pagedCards.length === pageSize;
        page++;
      }

      const cards = allCards;
      this.logger.info(`Total cards fetched: ${cards.length}`);

      stats.totalCards = cards.length;

      // Calculate average cards per set
      stats.averageCardsPerSet = stats.totalCards / stats.totalSets;

      // Check cards without prices
      const cardsWithoutPrices = cards.filter(card => card.tcg_price === null);
      stats.cardsWithoutPrices = cardsWithoutPrices.length;

      if (cardsWithoutPrices.length > 0) {
        warnings.push({
          type: 'CARDS_WITHOUT_PRICES',
          message: `Found ${cardsWithoutPrices.length} cards without prices`,
          affectedEntities: cardsWithoutPrices.length > 20 
            ? cardsWithoutPrices.slice(0, 20).map(card => `${card.id} (${card.name})`)
            : cardsWithoutPrices.map(card => `${card.id} (${card.name})`)
        });
      }

      // Check cards without images
      const cardsWithoutImages = cards.filter(card => !card.image_small || !card.image_large);
      stats.cardsWithoutImages = cardsWithoutImages.length;

      if (cardsWithoutImages.length > 0) {
        warnings.push({
          type: 'CARDS_WITHOUT_IMAGES',
          message: `Found ${cardsWithoutImages.length} cards without images`,
          affectedEntities: cardsWithoutImages.length > 20 
            ? cardsWithoutImages.slice(0, 20).map(card => `${card.id} (${card.name})`)
            : cardsWithoutImages.map(card => `${card.id} (${card.name})`)
        });
      }

      // Calculate price update statistics
      const cardsWithPriceUpdates = cards.filter(card => card.price_updated_at !== null);
      
      if (cardsWithPriceUpdates.length > 0) {
        const updateDates = cardsWithPriceUpdates.map(card => new Date(card.price_updated_at!));
        const oldestDate = new Date(Math.min(...updateDates.map(date => date.getTime())));
        const newestDate = new Date(Math.max(...updateDates.map(date => date.getTime())));
        
        stats.oldestPriceUpdate = oldestDate.toISOString();
        stats.newestPriceUpdate = newestDate.toISOString();
      }

      this.logger.info('Data validation completed successfully');
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats
      };

    } catch (error: any) {
      this.logger.error('Data validation failed', error);
      
      errors.push({
        type: 'VALIDATION_FAILED',
        message: `Validation failed: ${error.message}`
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        stats
      };
    }
  }

  /**
   * Validate a specific set for data consistency and completeness
   * @param setId The ID of the set to validate
   */
  static async validateSet(setId: string): Promise<ValidationResult> {
    const supabase = await createServerSupabaseClient();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const stats: ValidationStats = {
      totalSets: 1,
      totalCards: 0,
      setsWithoutCards: 0,
      cardsWithoutPrices: 0,
      cardsWithoutImages: 0,
      averageCardsPerSet: 0,
      oldestPriceUpdate: null,
      newestPriceUpdate: null
    };

    try {
      this.logger.info(`Starting validation for set: ${setId}`);

      // Get set info
      const { data: set, error: setError } = await supabase
        .from('sets')
        .select('id, name, release_date')
        .eq('id', setId)
        .single();

      if (setError) {
        throw setError;
      }

      if (!set) {
        errors.push({
          type: 'SET_NOT_FOUND',
          message: `Set ${setId} not found in the database`
        });
        return {
          isValid: false,
          errors,
          warnings,
          stats
        };
      }

      // Get cards for this set - using pagination in case a set has a lot of cards
      let allCards: any[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase default limit
      let hasMore = true;

      this.logger.info(`Fetching all cards for set ${setId} using pagination`);
      
      while (hasMore) {
        const { data: pagedCards, error: cardsError } = await supabase
          .from('cards')
          .select('id, name, set_id, tcg_price, price_updated_at, image_small, image_large')
          .eq('set_id', setId)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (cardsError) {
          throw cardsError;
        }

        if (pagedCards.length > 0) {
          allCards = [...allCards, ...pagedCards];
          this.logger.info(`Fetched page ${page + 1}: ${pagedCards.length} cards, total so far: ${allCards.length}`);
        }
        
        hasMore = pagedCards.length === pageSize;
        page++;
      }

      const cards = allCards;
      this.logger.info(`Total cards fetched for set ${setId}: ${cards.length}`);

      stats.totalCards = cards.length;
      stats.averageCardsPerSet = stats.totalCards;

      if (cards.length === 0) {
        stats.setsWithoutCards = 1;
        warnings.push({
          type: 'SET_WITHOUT_CARDS',
          message: `Set ${setId} (${set.name}) has no cards`
        });
      }

      // Check cards without prices
      const cardsWithoutPrices = cards.filter(card => card.tcg_price === null);
      stats.cardsWithoutPrices = cardsWithoutPrices.length;

      if (cardsWithoutPrices.length > 0) {
        warnings.push({
          type: 'CARDS_WITHOUT_PRICES',
          message: `Found ${cardsWithoutPrices.length} cards without prices in set ${setId}`,
          affectedEntities: cardsWithoutPrices.length > 20 
            ? cardsWithoutPrices.slice(0, 20).map(card => `${card.id} (${card.name})`)
            : cardsWithoutPrices.map(card => `${card.id} (${card.name})`)
        });
      }

      // Check cards without images
      const cardsWithoutImages = cards.filter(card => !card.image_small || !card.image_large);
      stats.cardsWithoutImages = cardsWithoutImages.length;

      if (cardsWithoutImages.length > 0) {
        warnings.push({
          type: 'CARDS_WITHOUT_IMAGES',
          message: `Found ${cardsWithoutImages.length} cards without images in set ${setId}`,
          affectedEntities: cardsWithoutImages.length > 20 
            ? cardsWithoutImages.slice(0, 20).map(card => `${card.id} (${card.name})`)
            : cardsWithoutImages.map(card => `${card.id} (${card.name})`)
        });
      }

      // Calculate price update statistics
      const cardsWithPriceUpdates = cards.filter(card => card.price_updated_at !== null);
      
      if (cardsWithPriceUpdates.length > 0) {
        const updateDates = cardsWithPriceUpdates.map(card => new Date(card.price_updated_at!));
        const oldestDate = new Date(Math.min(...updateDates.map(date => date.getTime())));
        const newestDate = new Date(Math.max(...updateDates.map(date => date.getTime())));
        
        stats.oldestPriceUpdate = oldestDate.toISOString();
        stats.newestPriceUpdate = newestDate.toISOString();
      }

      this.logger.info(`Validation for set ${setId} completed successfully`);
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats
      };

    } catch (error: any) {
      this.logger.error(`Validation for set ${setId} failed`, error);
      
      errors.push({
        type: 'VALIDATION_FAILED',
        message: `Validation failed: ${error.message}`
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        stats
      };
    }
  }
} 