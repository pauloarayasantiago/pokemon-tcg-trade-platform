import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { PriceUpdateService } from '@/lib/services/price-update-service';

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
 * Test endpoint for scheduled price updates with tiered prioritization
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'stats'; // 'stats', 'run'
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const logger = new Logger('test-price-schedule');
  
  try {
    if (mode === 'stats') {
      // Get price update statistics
      logger.info('Fetching price update statistics');
      const stats = await PriceUpdateService.getPriceUpdateStats(supabase);
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        stats
      });
    } else if (mode === 'run') {
      // Run scheduled price updates
      logger.info('Starting scheduled price updates');
      const startTime = Date.now();
      
      const results = await PriceUpdateService.scheduleUpdates(supabase);
      
      const executionTimeMs = Date.now() - startTime;
      
      // Calculate total cards processed
      const totalCardsProcessed = 
        results.highTier.cardsProcessed + 
        results.mediumTier.cardsProcessed + 
        results.lowTier.cardsProcessed;
      
      // Calculate total successful updates
      const totalSuccessfulUpdates = 
        results.highTier.successfulUpdates + 
        results.mediumTier.successfulUpdates + 
        results.lowTier.successfulUpdates;
      
      // Calculate total failed updates
      const totalFailedUpdates = 
        results.highTier.failedUpdates + 
        results.mediumTier.failedUpdates + 
        results.lowTier.failedUpdates;
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs,
        summary: {
          totalCardsProcessed,
          totalSuccessfulUpdates,
          totalFailedUpdates
        },
        results
      });
    } else {
      return NextResponse.json({
        success: false,
        timestamp: new Date().toISOString(),
        error: `Invalid mode: ${mode}. Valid modes are 'stats' and 'run'.`
      }, { status: 400 });
    }
  } catch (error: any) {
    logger.error(`Price schedule operation failed`, error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
} 