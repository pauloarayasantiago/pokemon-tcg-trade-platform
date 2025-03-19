import { NextResponse } from 'next/server';
import { PokemonTcgService } from '@/lib/services/pokemon-tcg-service';
import { Logger } from '@/lib/utils/logger';

/**
 * Endpoint for Pokemon TCG API interaction with flexible sync options
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId'); // Allow targeting specific set
  const mode = searchParams.get('mode') || 'full'; // 'full', 'sets-only', 'cards-only'
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const batchSize = searchParams.get('batchSize') ? parseInt(searchParams.get('batchSize')!) : 5;
  
  const startTime = Date.now();
  const logger = new Logger('pokemon-tcg');
  
  try {
    logger.info(`Starting sync operation: mode=${mode}, setId=${setId || 'all'}, limit=${limit || 'none'}, batchSize=${batchSize}`);
    
    const service = new PokemonTcgService();
    let result;
    
    switch (mode) {
      case 'sets-only':
        result = await service.syncAllSets();
        break;
      
      case 'cards-only':
        if (setId) {
          result = await service.syncCardsForSet(setId);
        } else {
          // Need to handle syncing all cards - implementation will depend on service capability
          result = { message: "Syncing all cards not directly supported, use full sync instead" };
        }
        break;
      
      case 'full':
      default:
        if (setId) {
          // For a specific set, we just sync cards for that set
          result = await service.syncCardsForSet(setId);
        } else {
          // Full sync requires running syncAllSets and then syncing all cards
          const setsResult = await service.syncAllSets();
          result = {
            sets: setsResult,
            message: "Full card sync requires visiting each set individually, see sets for details"
          };
        }
        break;
    }
    
    const executionTimeMs = Date.now() - startTime;
    logger.info(`Sync completed in ${executionTimeMs}ms`);
    
    return NextResponse.json({
      status: 'success',
      mode,
      setId: setId || null,
      executionTimeMs,
      result
    });
    
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    logger.error(`Sync failed: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        mode,
        setId: setId || null,
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