import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * Enhanced test endpoint for Supabase connectivity with database statistics
 */
export async function GET() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Test a simple query to check if Supabase is connected
    const { data: rarityTypes, error: rarityError } = await supabase
      .from('rarity_types')
      .select('*')
      .limit(3);
    
    if (rarityError) {
      throw rarityError;
    }
    
    // Get database statistics
    const stats = await getDatabaseStats(supabase);
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection is working',
      timestamp: new Date().toISOString(),
      sample: rarityTypes,
      stats
    });
  } catch (error) {
    console.error('Supabase connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive database statistics
 */
async function getDatabaseStats(supabase: any) {
  // Get set count
  const { count: setCount, error: setError } = await supabase
    .from('sets')
    .select('*', { count: 'exact', head: true });
  
  if (setError) throw setError;
  
  // Get card count
  const { count: cardCount, error: cardError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true });
  
  if (cardError) throw cardError;
  
  // Get variation count
  const { count: variationCount, error: varError } = await supabase
    .from('card_variations')
    .select('*', { count: 'exact', head: true });
  
  if (varError) throw varError;
  
  // Get set distribution
  const { data: setDistribution, error: distError } = await supabase
    .rpc('get_card_count_by_set');
  
  if (distError) {
    // Fallback if RPC function doesn't exist
    console.warn('RPC function not available, using alternative query');
    const { data: fallbackDist, error: fallbackError } = await supabase
      .from('cards')
      .select('set_id')
      .order('set_id');
    
    if (fallbackError) throw fallbackError;
    
    // Count cards per set manually
    const distribution: { [key: string]: number } = {};
    fallbackDist.forEach((card: { set_id: string }) => {
      distribution[card.set_id] = (distribution[card.set_id] || 0) + 1;
    });
    
    const formattedDist = Object.entries(distribution).map(([setId, count]) => ({
      set_id: setId,
      card_count: count
    }));
    
    return {
      sets: setCount,
      cards: cardCount,
      variations: variationCount,
      setDistribution: formattedDist
    };
  }
  
  return {
    sets: setCount,
    cards: cardCount,
    variations: variationCount,
    setDistribution: setDistribution
  };
} 