import { NextResponse } from 'next/server';
import { CardSearch, CardSearchParams } from '@/lib/utils/card-search';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('test-card-search');

/**
 * GET handler for optimized card search endpoint
 * Parameters:
 * - name: Card name search (partial match)
 * - setId: Filter by set ID
 * - rarity: Filter by rarity
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - limit: Number of results to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * - includeSetData: Whether to include set details (default: true)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const params: CardSearchParams = {
      name: searchParams.get('name') || undefined,
      setId: searchParams.get('setId') || undefined,
      rarity: searchParams.get('rarity') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      includeSetData: searchParams.get('includeSetData') !== 'false'
    };
    
    logger.info(`Starting card search with params: ${JSON.stringify(params)}`);
    
    // Execute the search
    const result = await CardSearch.searchCards(params);
    
    logger.info(`Search completed, found ${result.totalCount} cards in ${result.executionTimeMs}ms`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      params,
      resultsCount: result.cards.length,
      totalCount: result.totalCount,
      executionTimeMs: result.executionTimeMs,
      cards: result.cards
    });
  } catch (error: any) {
    logger.error(`Card search failed: ${error.message}`, error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for clearing the card search cache
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'clear-cache') {
      logger.info('Clearing card search cache');
      CardSearch.clearCache();
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Card search cache cleared successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: 'Invalid action. Supported actions: clear-cache'
    }, { status: 400 });
  } catch (error: any) {
    logger.error(`Cache operation failed: ${error.message}`, error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
} 