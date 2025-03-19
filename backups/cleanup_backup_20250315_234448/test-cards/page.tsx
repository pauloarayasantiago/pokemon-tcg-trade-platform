import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestCardsPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch a random assortment of cards (limit 20)
  const { data: cards, error } = await supabase
    .from('cards')
    .select(`
      *,
      set:sets(name, symbol_url),
      variations:card_variations(*)
    `)
    .order('last_sync_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching cards:', error);
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Database Test Error</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error:</p>
          <p>{error.message}</p>
        </div>
        <p>
          Make sure you've completed these steps:
        </p>
        <ol className="list-decimal ml-6 mt-4 space-y-2">
          <li>Added your Supabase credentials to .env.local</li>
          <li>Added your Pokemon TCG API key to .env.local</li>
          <li>Run the test API endpoint at <Link href="/api/test-pokemon-tcg" className="text-blue-600 underline">api/test-pokemon-tcg</Link> to sync data</li>
        </ol>
      </div>
    );
  }
  
  if (!cards || cards.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">No Cards Found</h1>
        <p className="mb-4">
          No cards were found in the database. Run the test API endpoint to sync Pokemon card data.
        </p>
        <Link 
          href="/api/test-pokemon-tcg" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Sync Pokemon Cards
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pokemon TCG API Integration Test</h1>
        <Link 
          href="/api/test-pokemon-tcg" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Sync More Cards
        </Link>
      </div>
      
      <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
        <p className="font-bold">Success!</p>
        <p>Found {cards.length} cards in the database.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => (
          <div key={card.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative h-64 bg-gray-100">
              {card.image_small ? (
                <Image
                  src={card.image_small}
                  alt={card.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold">{card.name}</h2>
                {card.set?.symbol_url && (
                  <Image 
                    src={card.set.symbol_url} 
                    alt={`${card.set.name} symbol`}
                    width={20}
                    height={20}
                    className="ml-2"
                  />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">Set: {card.set?.name || card.set_id}</p>
              <p className="text-sm text-gray-600 mb-1">Number: {card.number}</p>
              <p className="text-sm text-gray-600 mb-3">Rarity: {card.rarity}</p>
              
              {card.tcg_price ? (
                <p className="text-lg font-semibold text-green-600">${card.tcg_price.toFixed(2)}</p>
              ) : (
                <p className="text-sm text-gray-500">Price not available</p>
              )}
              
              {card.variations && card.variations.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs font-semibold mb-1">Variations:</p>
                  <div className="flex flex-wrap gap-1">
                    {card.variations.map((variation, index) => (
                      <span 
                        key={`${variation.card_id}-${variation.variation_type}-${index}`}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full"
                      >
                        {variation.variation_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 