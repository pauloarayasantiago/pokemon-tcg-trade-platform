import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('price-update-health');

/**
 * Health check endpoint for price update service
 */
export async function GET() {
  try {
    logger.info('Performing price update service health check');
    
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Test database connection by checking card_prices table
    const { count, error } = await supabase
      .from('card_prices')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    // Check external price API connection
    // Note: In a real implementation, you might want to make a test request to 
    // the price API service you're using. For now, we just check database connectivity.
    
    return NextResponse.json({
      status: 'success',
      message: 'Price update service is available',
      timestamp: new Date().toISOString(),
      stats: {
        cardPricesCount: count
      }
    });
  } catch (error) {
    logger.error(`Price update service health check failed: ${(error as Error).message}`);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Price update service is unavailable',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 