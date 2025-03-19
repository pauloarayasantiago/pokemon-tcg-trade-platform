import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('rarities-api');

/**
 * GET handler for rarities endpoint
 * Returns all distinct rarity values from the cards table
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get distinct rarity values directly from the cards table
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
    
    return NextResponse.json({
      status: 'success',
      rarities: uniqueRarities
    });
  } catch (error: any) {
    logger.error(`Error fetching rarities: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Error fetching rarities',
        error: error.message
      },
      { status: 500 }
    );
  }
} 