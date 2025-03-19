import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

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
}

/**
 * Test endpoint for price update functionality with tiered prioritization
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') || 'all'; // 'high', 'medium', 'low', 'all'
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const logger = new Logger('test-price-update');
  
  try {
    logger.info(`Starting price update test for tier: ${tier}, limit: ${limit}`);
    
    // Get the cards table with proper typing
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
    
    // Get cards to update
    const { data: cards, error } = await filteredQuery
      .select('id, name, set_id, tcg_price, price_updated_at')
      .order('price_updated_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    logger.info(`Found ${cards?.length || 0} cards to update prices for`);
    
    if (!cards || cards.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        tier,
        message: 'No cards found matching the criteria',
        cardsProcessed: 0
      });
    }
    
    // Simulate price updates
    const results = [];
    for (const card of cards) {
      try {
        // In a real implementation, this would call the Pokemon TCG API
        // For now, we'll simulate a price update
        const oldPrice = card.tcg_price;
        const newPrice = simulateNewPrice(oldPrice);
        
        // Update the card price
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
        
        logger.info(`Updated price for ${card.name}: $${oldPrice} -> $${newPrice}`);
      } catch (error: any) {
        logger.error(`Failed to update price for card ${card.id}`, error);
        results.push({
          cardId: card.id,
          cardName: card.name,
          setId: card.set_id,
          error: error.message,
          success: false
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tier,
      cardsProcessed: cards.length,
      successfulUpdates: results.filter(r => r.success).length,
      failedUpdates: results.filter(r => !r.success).length,
      results
    });
  } catch (error: any) {
    logger.error(`Price update test failed`, error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Simulate a price change for testing purposes
 */
function simulateNewPrice(oldPrice: number | null): number {
  if (!oldPrice) return Math.random() * 5; // Random price for cards without a price
  
  // Simulate a price change of -10% to +10%
  const changePercent = (Math.random() * 20) - 10;
  const newPrice = oldPrice * (1 + (changePercent / 100));
  
  // Ensure price is never negative and round to 2 decimal places
  return Math.max(0.01, Math.round(newPrice * 100) / 100);
} 