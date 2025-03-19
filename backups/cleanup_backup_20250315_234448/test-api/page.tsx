'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function TestApiPage() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncMode, setSyncMode] = useState<string>('full');
  const [setId, setSetId] = useState<string>('');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [sets, setSets] = useState<any[]>([]);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get cards
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .limit(5);

        if (cardsError) throw cardsError;
        setCards(cardsData || []);
        
        // Get sets for dropdown
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('id, name')
          .order('name');
          
        if (setsError) throw setsError;
        setSets(setsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSyncCards = async () => {
    try {
      setSyncInProgress(true);
      setSyncResult(null);
      
      // Build URL based on selected options
      let url = `/api/test-pokemon-tcg?mode=${syncMode}`;
      
      if (setId && syncMode === 'cards-only') {
        url += `&setId=${setId}`;
      }
      
      url += `&batchSize=${batchSize}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      setSyncResult(result);
      
      if (result.success) {
        // Refresh the cards
        const { data } = await supabase
          .from('cards')
          .select('*')
          .limit(5);
        
        setCards(data || []);
      }
    } catch (err) {
      console.error('Error syncing cards:', err);
      setSyncResult({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSyncInProgress(false);
    }
  };

  // Format JSON for display
  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Database Connection</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-4">
            {loading ? "Testing connection to Supabase..." : 
             error ? "❌ Connection failed" : 
             "✅ Successfully connected to Supabase"}
          </p>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Error:</p>
              <p>{error.message}</p>
            </div>
          )}
          
          {!loading && !error && (
            <>
              <p className="mb-2 font-semibold">Recent Cards in Database:</p>
              {cards.length === 0 ? (
                <p className="text-yellow-600">No cards found. Try syncing some cards using the button below.</p>
              ) : (
                <ul className="list-disc ml-6 mb-4">
                  {cards.map(card => (
                    <li key={card.id}>{card.name} ({card.set_id})</li>
                  ))}
                </ul>
              )}
            </>
          )}
          
          <div className="mb-6 flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sync Mode:
              </label>
              <select 
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full">Full Sync (Sets + Prioritized Cards)</option>
                <option value="sets-only">Sets Only</option>
                <option value="cards-only">Cards by Set</option>
                <option value="priority-sync">Prioritized Sync</option>
                <option value="get-priority-sets">Get Priority Sets (No Sync)</option>
              </select>
            </div>
            
            {syncMode === 'cards-only' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Set ID (optional):
                </label>
                <select 
                  value={setId}
                  onChange={(e) => setSetId(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Sets</option>
                  {sets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.name} ({set.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size:
              </label>
              <input 
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">
                (Sets processed in parallel)
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSyncCards}
            disabled={syncInProgress}
            className={`px-4 py-2 rounded ${
              syncInProgress 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {syncInProgress ? "Syncing..." : "Run Sync Operation"}
          </button>
          
          {syncResult && (
            <div className={`mt-4 p-4 rounded border ${
              syncResult.success 
                ? "bg-green-100 border-green-400 text-green-700" 
                : "bg-red-100 border-red-400 text-red-700"
            }`}>
              <p className="font-bold mb-2">{syncResult.success ? "Success!" : "Error:"}</p>
              
              {syncResult.success ? (
                <div>
                  <p className="mb-2">
                    <strong>Mode:</strong> {syncResult.mode} | 
                    <strong> Execution Time:</strong> {syncResult.executionTimeMs}ms
                  </p>
                  
                  {syncResult.result.sets && (
                    <div className="mb-4">
                      <h3 className="font-bold">Sets:</h3>
                      <p>Total sets: {syncResult.result.sets.totalSets}</p>
                      <p>Last sync: {new Date(syncResult.result.sets.syncedAt).toLocaleString()}</p>
                    </div>
                  )}
                  
                  {syncResult.result.cards && (
                    <div className="mb-4">
                      <h3 className="font-bold">Cards:</h3>
                      {syncResult.result.cards.totalCards && (
                        <p>Total cards: {syncResult.result.cards.totalCards}</p>
                      )}
                      {syncResult.result.cards.setsProcessed && (
                        <>
                          <p>Sets processed: {syncResult.result.cards.setsProcessed}</p>
                          <p>Successful: {syncResult.result.cards.successfulSets} | Failed: {syncResult.result.cards.failedSets}</p>
                          <p>Cards processed: {syncResult.result.cards.totalCardsProcessed}</p>
                          <p>Variations processed: {syncResult.result.cards.totalVariationsProcessed}</p>
                        </>
                      )}
                      <p>Last sync: {new Date(syncResult.result.cards.syncedAt).toLocaleString()}</p>
                    </div>
                  )}
                  
                  {syncResult.result.priority && (
                    <div className="mb-4">
                      <h3 className="font-bold">Priority Data:</h3>
                      {syncResult.result.priority.highPriority !== undefined && (
                        <div>
                          <p>Total sets: {syncResult.result.priority.totalSets}</p>
                          <p>
                            By priority: 
                            <span className="ml-1 text-red-600">{syncResult.result.priority.highPriority} high</span> | 
                            <span className="ml-1 text-yellow-600">{syncResult.result.priority.mediumPriority} medium</span> | 
                            <span className="ml-1 text-blue-600">{syncResult.result.priority.lowPriority} low</span>
                          </p>
                        </div>
                      )}
                      
                      {syncResult.result.priority.sets && syncResult.result.priority.sets.length > 0 && (
                        <div>
                          <p className="font-semibold mt-2">First 5 sets by priority:</p>
                          <ul className="list-disc ml-6">
                            {syncResult.result.priority.sets.slice(0, 5).map((set: any) => (
                              <li key={set.id}>
                                {set.name} - 
                                <span className={`ml-1 font-medium ${
                                  set.priority === 'high' ? 'text-red-600' : 
                                  set.priority === 'medium' ? 'text-yellow-600' : 
                                  'text-blue-600'
                                }`}>
                                  {set.priority}
                                </span> - 
                                {set.syncedCount}/{set.total} cards
                                {set.lastSyncAt && ` (Last sync: ${new Date(set.lastSyncAt).toLocaleDateString()})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {syncResult.result.priority.syncedSets && (
                        <div className="mt-2">
                          <p className="font-semibold">Recently synced sets:</p>
                          <ul className="list-disc ml-6">
                            {syncResult.result.priority.syncedSets.slice(0, 5).map((set: any) => (
                              <li key={set.id}>
                                {set.name} - {set.cardCount} cards
                                {set.lastSyncAt && ` (Last sync: ${new Date(set.lastSyncAt).toLocaleDateString()})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <button 
                      onClick={() => setSyncResult(null)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                  {formatJson(syncResult.error)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Navigation</h2>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/test-cards" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            View Test Cards
          </Link>
          <Link 
            href="/test-cards/advanced" 
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Advanced Card Browser
          </Link>
        </div>
      </div>
    </div>
  );
} 