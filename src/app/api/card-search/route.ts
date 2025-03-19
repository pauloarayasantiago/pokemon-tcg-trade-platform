import { NextResponse } from 'next/server';
import { CardSearch } from '@/lib/utils/card-search';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('card-search');

/**
 * GET handler for card search endpoint
 * Parameters:
 * - q: Search query string
 * - set: Filter by set ID
 * - type: Filter by card type
 * - sort: Sort field (name, set, number, price)
 * - order: Sort order (asc, desc)
 * - limit: Maximum results to return
 * - offset: Pagination offset
 * - cache: Whether to use cached results (true/false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const setId = searchParams.get('set') || undefined;
    const type = searchParams.get('type') || undefined;
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const useCache = searchParams.get('cache') !== 'false';
    
    logger.info(`Card search request: q="${query}", set=${setId || 'any'}, type=${type || 'any'}, sort=${sort}, order=${order}, limit=${limit}, offset=${offset}, cache=${useCache}`);
    
    const startTime = Date.now();
    const searchResult = await CardSearch.searchCards({
      name: query,
      setId,
      type,
      limit,
      offset,
    });
    
    const executionTimeMs = Date.now() - startTime;
    logger.info(`Search completed in ${executionTimeMs}ms, found ${searchResult.totalResults} results`);
    
    return NextResponse.json({
      status: 'success',
      executionTimeMs,
      ...searchResult
    });
  } catch (error: any) {
    logger.error(`Search failed: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Card search failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 