import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('admin-cards-api');

/**
 * GET handler for admin card browser endpoint
 * Parameters:
 * - search: Search query for card name
 * - set: Filter by set ID
 * - rarity: Filter by rarity
 * - type: Filter by Pokemon type
 * - generation: Filter by Pokemon generation
 * - era: Filter by card era
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - sort: Sort field (name, set, number, price, updated_at)
 * - order: Sort order (asc, desc)
 * - page: Page number (1-based)
 * - limit: Maximum results per page
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const setId = searchParams.get('set') || undefined;
    const rarity = searchParams.get('rarity') || undefined;
    const type = searchParams.get('type') || undefined;
    const generation = searchParams.get('generation') ? parseInt(searchParams.get('generation')!) : undefined;
    const era = searchParams.get('era') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortField = searchParams.get('sort') || 'name';
    const sortOrder = searchParams.get('order') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Calculate offset from page and limit
    const offset = (page - 1) * limit;
    
    logger.info(`Admin card browser request: search="${search}", set=${setId || 'any'}, rarity=${rarity || 'any'}, type=${type || 'any'}, generation=${generation || 'any'}, era=${era || 'any'}, price=${minPrice || '0'}-${maxPrice || 'any'}, sort=${sortField}, order=${sortOrder}, page=${page}, limit=${limit}`);
    
    const supabase = await createServerSupabaseClient();
    
    // Create a function to apply filters to a query
    const applyFilters = (query: any) => {
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      if (setId) {
        query = query.eq('set_id', setId);
      }
      
      if (rarity) {
        query = query.eq('rarity', rarity);
      }
      
      if (type) {
        // For type filtering, check if the type is in the types array
        query = query.contains('types', [type]);
      }
      
      if (generation) {
        query = query.eq('pokemon_generation', generation);
      }
      
      if (era) {
        query = query.eq('card_era', era);
      }
      
      if (minPrice !== undefined) {
        query = query.gte('tcg_price', minPrice);
      }
      
      if (maxPrice !== undefined) {
        query = query.lte('tcg_price', maxPrice);
      }
      
      return query;
    };
    
    // Create base query for cards with joins
    const baseQuery = supabase
      .from('cards')
      .select(`
        *,
        sets:set_id (
          id,
          name
        )
      `);
    
    // Apply filters to get filtered query
    const filteredQuery = applyFilters(baseQuery);
    
    // Get total count with a separate count query
    const countQuery = supabase
      .from('cards')
      .select('*', { count: 'exact', head: true });
    
    // Apply the same filters to count query
    const filteredCountQuery = applyFilters(countQuery);
    
    // Get the count - this is the correct way to get the count from a query with count: 'exact'
    const { data: _, count, error: countError } = await filteredCountQuery;
    
    if (countError) {
      throw countError;
    }
    
    // Apply sorting and pagination to the filtered query
    let sortFieldName = sortField;
    if (sortField === 'set') {
      sortFieldName = 'set_id'; // Sort by set_id since we don't have set_name directly
    } else if (sortField === 'price') {
      sortFieldName = 'tcg_price';
    } else if (sortField === 'updated_at') {
      sortFieldName = 'price_updated_at';
    }
    
    const { data: cards, error } = await filteredQuery
      .order(sortFieldName, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Transform the data to include set_name
    const transformedCards = cards.map((card: any) => ({
      ...card,
      set_name: card.sets?.name || 'Unknown Set'
    }));
    
    // Also fetch all sets for filtering options
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, name, series, release_date')
      .order('release_date', { ascending: false });
    
    if (setsError) {
      throw setsError;
    }
    
    // Get distinct rarity values for filtering options
    const { data: rarities, error: raritiesError } = await supabase
      .from('cards')
      .select('rarity')
      .not('rarity', 'is', null)
      .order('rarity');
    
    if (raritiesError) {
      throw raritiesError;
    }
    
    // Extract unique rarities
    const uniqueRarities = Array.from(new Set(
      rarities
        .map(r => r.rarity)
        .filter(Boolean) // Remove null/undefined values
    ));
    
    logger.info(`Found ${uniqueRarities.length} unique rarities`);
    
    // Get all unique types
    const { data: typeData, error: typeError } = await supabase
      .from('cards')
      .select('types')
      .not('types', 'is', null)
      .limit(500);
    
    if (typeError) {
      throw typeError;
    }
    
    // Extract unique types
    const uniqueTypes = Array.from(new Set(
      typeData
        .flatMap(card => card.types || [])
        .filter(Boolean)
    )).sort();
    
    // Get all unique generations
    const { data: genData, error: genError } = await supabase
      .from('cards')
      .select('pokemon_generation')
      .not('pokemon_generation', 'is', null)
      .limit(500);
    
    if (genError) {
      throw genError;
    }
    
    // Extract unique generations
    const uniqueGenerations = Array.from(new Set(
      genData
        .map(card => card.pokemon_generation)
        .filter(Boolean)
    )).sort();
    
    // Get all unique eras
    const { data: eraData, error: eraError } = await supabase
      .from('cards')
      .select('card_era')
      .not('card_era', 'is', null)
      .limit(500);
    
    if (eraError) {
      throw eraError;
    }
    
    // Extract unique eras
    const uniqueEras = Array.from(new Set(
      eraData
        .map(card => card.card_era)
        .filter(Boolean)
    )).sort();
    
    return NextResponse.json({
      status: 'success',
      cards: transformedCards,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      sets,
      rarities: uniqueRarities,
      types: uniqueTypes,
      generations: uniqueGenerations,
      eras: uniqueEras,
      filters: {
        search,
        setId,
        rarity,
        type,
        generation,
        era,
        minPrice,
        maxPrice,
        sortField,
        sortOrder
      }
    });
  } catch (error: any) {
    logger.error(`Admin card browser error: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Error fetching cards',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 