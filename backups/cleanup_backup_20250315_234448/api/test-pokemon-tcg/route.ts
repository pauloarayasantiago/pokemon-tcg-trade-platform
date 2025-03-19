import { NextResponse } from 'next/server';
import { PokemonTcgService } from '@/lib/services/pokemon-tcg-service';
import { Logger } from '@/lib/utils/logger';

/**
 * Enhanced test endpoint for Pokemon TCG API interaction with flexible sync options
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId'); // Allow targeting specific set
  const mode = searchParams.get('mode') || 'full'; // 'full', 'sets-only', 'cards-only'
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const batchSize = searchParams.get('batchSize') ? parseInt(searchParams.get('batchSize')!) : 5;
  
  const startTime = Date.now();
  const logger = new Logger('test-pokemon-tcg');
  
  try {
    logger.info(`Starting sync operation: mode=${mode}, setId=${setId || 'all'}, limit=${limit || 'none'}, batchSize=${batchSize}`);
    
    let setsResult;
    let cardsResult;
    
    // Create instance of PokemonTcgService
    const service = new PokemonTcgService();
    
    // Sync sets if mode is 'sets-only' or 'full'
    if (mode === 'sets-only' || mode === 'full') {
      logger.info('Starting set synchronization');
      setsResult = await service.syncAllSets();
      logger.info(`Synced ${setsResult.totalSets} sets`);
    }
    
    // Sync cards if mode is 'cards-only' or 'full'
    if (mode === 'cards-only' || mode === 'full') {
      if (setId) {
        // Sync specific set
        logger.info(`Starting card sync for set: ${setId}`);
        cardsResult = await service.syncCardsForSet(setId, { limit });
        logger.info(`Synced cards for set ${setId}: ${cardsResult.totalCards} cards processed`);
      } else {
        // Sync all sets with optional limit per set
        const sets = await service.getAllSets();
        logger.info(`Preparing to sync cards for ${sets.length} sets in batches of ${batchSize}`);
        
        const results = [];
        
        // Process sets in batches to respect API rate limits
        for (let i = 0; i < sets.length; i += batchSize) {
          const batch = sets.slice(i, i + batchSize);
          logger.info(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(sets.length/batchSize)}`);
          
          // Process each set in the batch
          for (const set of batch) {
            try {
              logger.info(`Starting card sync for set: ${set.id} (${set.name})`);
              const setResult = await service.syncCardsForSet(set.id, { limit });
              
              results.push({
                setId: set.id,
                setName: set.name,
                cardsProcessed: setResult.totalCards,
                success: true
              });
              
              logger.info(`Completed card sync for set: ${set.id}, found ${setResult.totalCards} cards`);
            } catch (error: any) {
              logger.error(`Failed to sync set ${set.id}`, error);
              results.push({
                setId: set.id,
                setName: set.name,
                error: error.message,
                success: false
              });
            }
          }
          
          // Add delay between batches to respect API rate limits
          if (i + batchSize < sets.length) {
            logger.info(`Waiting 2 seconds before processing next batch...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        cardsResult = {
          setsProcessed: results.length,
          successfulSets: results.filter(r => r.success).length,
          failedSets: results.filter(r => !r.success).length,
          totalCardsProcessed: results.reduce((sum, r) => sum + (r.cardsProcessed || 0), 0),
          setResults: results
        };
      }
    }
    
    const executionTimeMs = Date.now() - startTime;
    logger.info(`Sync operation completed in ${executionTimeMs}ms`);
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      mode,
      setId: setId || 'all',
      executionTimeMs,
      result: {
        // Include mode-specific results
        ...(mode === 'sets-only' || mode === 'full' ? { sets: setsResult } : {}),
        ...(mode === 'cards-only' || mode === 'full' ? { cards: cardsResult } : {})
      }
    });
  } catch (error: any) {
    logger.error(`Sync operation failed`, error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    }, { status: 500 });
  }
}