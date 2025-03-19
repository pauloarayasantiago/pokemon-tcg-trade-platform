import { NextResponse } from 'next/server';
import * as PokemonTcgApi from '@/lib/services/pokemon-tcg-api';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('pokemon-tcg-health');

/**
 * Health check endpoint for Pokemon TCG API
 */
export async function GET() {
  try {
    logger.info('Performing Pokemon TCG API health check');
    
    // Test the API by fetching a minimal amount of data
    const testResponse = await PokemonTcgApi.getAllSets();
    
    if (!testResponse || !testResponse.data || testResponse.data.length === 0) {
      throw new Error('No data returned from Pokemon TCG API');
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Pokemon TCG API is available',
      timestamp: new Date().toISOString(),
      sample: testResponse.data[0]
    });
  } catch (error) {
    logger.error(`Pokemon TCG API health check failed: ${(error as Error).message}`);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Pokemon TCG API is unavailable',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 