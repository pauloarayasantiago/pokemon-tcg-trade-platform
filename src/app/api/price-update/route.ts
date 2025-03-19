import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { PriceUpdateService } from '@/lib/services/price-update-service';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('price-update');

/**
 * Endpoint for card price update operations
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  const batchSize = searchParams.get('batchSize') ? parseInt(searchParams.get('batchSize')!) : 10;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const priorityOnly = searchParams.get('priorityOnly') === 'true';
  
  const startTime = Date.now();
  
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    const priceService = new PriceUpdateService(supabase);
    let result;
    
    if (cardId) {
      logger.info(`Starting price update for specific card: ${cardId}`);
      result = await priceService.updatePriceForCard(cardId);
    } else {
      logger.info(`Starting batch price update: batchSize=${batchSize}, limit=${limit || 'none'}, priorityOnly=${priorityOnly}`);
      result = await priceService.batchUpdatePrices(batchSize, limit, priorityOnly);
    }
    
    const executionTimeMs = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'success',
      cardId: cardId || null,
      executionTimeMs,
      result
    });
    
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    logger.error(`Price update failed: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        cardId: cardId || null,
        executionTimeMs,
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
} 