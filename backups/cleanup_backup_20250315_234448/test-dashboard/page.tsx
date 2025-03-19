'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiStatus {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  timestamp?: string;
  data?: any;
}

interface DatabaseStats {
  sets: number;
  cards: number;
  variations: number;
  setDistribution?: any[];
}

export default function TestDashboardPage() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'price' | 'stats' | 'validation'>('overview');
  const [syncParams, setSyncParams] = useState({
    setId: '',
    mode: 'full',
    limit: '100',
    batchSize: '5'
  });
  const [priceParams, setPriceParams] = useState({
    tier: 'all',
    limit: '10'
  });
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [priceUpdateInProgress, setPriceUpdateInProgress] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [validatingData, setValidatingData] = useState<boolean>(false);
  const [validationTarget, setValidationTarget] = useState<string>('all');
  const [validationError, setValidationError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkApiStatuses();
    fetchDatabaseStats();
  }, []);

  const checkApiStatuses = async () => {
    setLoading(true);
    const statuses: ApiStatus[] = [];

    // Check Supabase connection
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      statuses.push({
        endpoint: 'Supabase',
        status: data.status === 'success' ? 'success' : 'error',
        message: data.message,
        timestamp: data.timestamp,
        data: data.stats
      });
      
      if (data.stats) {
        setDbStats(data.stats);
      }
    } catch (error) {
      statuses.push({
        endpoint: 'Supabase',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check Pokemon TCG API status
    try {
      const { data, error } = await supabase
        .from('sets')
        .select('count', { count: 'exact', head: true });
      
      statuses.push({
        endpoint: 'Pokemon TCG API',
        status: !error ? 'success' : 'error',
        message: !error 
          ? `Database contains ${data} sets` 
          : `Error: ${error.message}`
      });
    } catch (error) {
      statuses.push({
        endpoint: 'Pokemon TCG API',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setApiStatuses(statuses);
    setLoading(false);
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      
      if (data.status === 'success' && data.stats) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  };

  const handleSyncCards = async () => {
    try {
      setSyncInProgress(true);
      setSyncResult(null);
      
      // Build URL with parameters
      const params = new URLSearchParams();
      if (syncParams.setId) params.append('setId', syncParams.setId);
      params.append('mode', syncParams.mode);
      params.append('limit', syncParams.limit);
      params.append('batchSize', syncParams.batchSize);
      
      const url = `/api/test-pokemon-tcg?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      setSyncResult(result);
      
      // Refresh database stats after sync
      if (result.success) {
        await fetchDatabaseStats();
        await checkApiStatuses();
      }
    } catch (error) {
      console.error('Error syncing cards:', error);
      setSyncResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const handlePriceUpdate = async () => {
    try {
      setPriceUpdateInProgress(true);
      setPriceResult(null);
      
      // Build URL with parameters
      const params = new URLSearchParams();
      params.append('tier', priceParams.tier);
      params.append('limit', priceParams.limit);
      
      const url = `/api/test-price-update?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      setPriceResult(result);
    } catch (error) {
      console.error('Error updating prices:', error);
      setPriceResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setPriceUpdateInProgress(false);
    }
  };

  const runDataValidation = async (target: string = 'all') => {
    try {
      setValidatingData(true);
      setValidationError(null);
      setValidationTarget(target);
      
      const endpoint = target === 'all' 
        ? '/api/test-data-validation' 
        : `/api/test-data-validation?setId=${target}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Validation failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setValidationData(data);
    } catch (error: any) {
      console.error('Data validation error:', error);
      setValidationError(error.message);
    } finally {
      setValidatingData(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pokémon TCG Test Dashboard</h1>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Database Stats Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Database</h2>
          {loading ? (
            <p>Loading stats...</p>
          ) : dbStats ? (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{dbStats.sets}</div>
                  <div className="text-sm text-gray-600">Sets</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{dbStats.cards}</div>
                  <div className="text-sm text-gray-600">Cards</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-700">{dbStats.variations}</div>
                  <div className="text-sm text-gray-600">Variations</div>
                </div>
              </div>
              <Link 
                href="/api/test-supabase" 
                className="text-blue-600 text-sm hover:underline"
                target="_blank"
              >
                View detailed stats →
              </Link>
            </div>
          ) : (
            <p className="text-red-600">Failed to load database stats</p>
          )}
        </div>
        
        {/* API Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">API Status</h2>
          {loading ? (
            <p>Checking API status...</p>
          ) : (
            <div className="space-y-3">
              {apiStatuses.map((api, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    api.status === 'success' ? 'bg-green-500' : 
                    api.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{api.endpoint}</div>
                    <div className="text-sm text-gray-600">{api.message}</div>
                  </div>
                </div>
              ))}
              <button 
                onClick={checkApiStatuses}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                Refresh status
              </button>
            </div>
          )}
        </div>
        
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href="/test-cards/advanced" 
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center"
            >
              Browse Cards
            </Link>
            <Link 
              href="/api/test-pokemon-tcg" 
              className="block w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-center"
              target="_blank"
            >
              Sync All Cards
            </Link>
            <Link 
              href="/api/test-price-update" 
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded text-center"
              target="_blank"
            >
              Update Prices
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'sync'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Card Sync
            </button>
            <button
              onClick={() => setActiveTab('price')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'price'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Price Updates
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Data Validation
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>
            <p className="mb-4">
              This dashboard provides tools to manage and monitor the Pokémon TCG data synchronization and price update system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Card Synchronization</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sync Pokémon card data from the TCG API to your database. You can sync specific sets or all sets at once.
                </p>
                <button
                  onClick={() => setActiveTab('sync')}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Card Sync →
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Price Updates</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Update card prices with tiered prioritization. Focus on high-value cards or update prices across all tiers.
                </p>
                <button
                  onClick={() => setActiveTab('price')}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Price Updates →
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Recent Activity</h3>
              <p className="text-sm text-gray-600">
                Check the API status and database statistics to monitor system health and data completeness.
              </p>
              <div className="mt-3">
                <button
                  onClick={checkApiStatuses}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded text-sm mr-2"
                >
                  Refresh Status
                </button>
                <button
                  onClick={fetchDatabaseStats}
                  className="bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded text-sm"
                >
                  Refresh Stats
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Card Sync Tab */}
        {activeTab === 'sync' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Card Synchronization</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Sync Pokémon card data from the TCG API to your database. You can customize the sync operation using the parameters below.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Set ID (optional)
                </label>
                <input
                  type="text"
                  value={syncParams.setId}
                  onChange={(e) => setSyncParams({...syncParams, setId: e.target.value})}
                  placeholder="e.g., sv1, swsh12"
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to sync all sets
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Mode
                </label>
                <select
                  value={syncParams.mode}
                  onChange={(e) => setSyncParams({...syncParams, mode: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="full">Full (Sets & Cards)</option>
                  <option value="sets-only">Sets Only</option>
                  <option value="cards-only">Cards Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cards Per Set Limit
                </label>
                <input
                  type="number"
                  value={syncParams.limit}
                  onChange={(e) => setSyncParams({...syncParams, limit: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={syncParams.batchSize}
                  onChange={(e) => setSyncParams({...syncParams, batchSize: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of sets to process in each batch
                </p>
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
              {syncInProgress ? "Syncing Cards..." : "Start Sync"}
            </button>
            
            {syncResult && (
              <div className={`mt-6 p-4 rounded border ${
                syncResult.success 
                  ? "bg-green-100 border-green-400 text-green-700" 
                  : "bg-red-100 border-red-400 text-red-700"
              }`}>
                <h3 className="font-semibold mb-2">
                  {syncResult.success ? "Sync Completed" : "Sync Failed"}
                </h3>
                {syncResult.success ? (
                  <div>
                    <p>Mode: {syncResult.mode}</p>
                    <p>Set: {syncResult.setId || 'All Sets'}</p>
                    <p>Execution Time: {syncResult.executionTimeMs}ms</p>
                    {syncResult.result?.cards && (
                      <div className="mt-2">
                        <p>Sets Processed: {syncResult.result.cards.setsProcessed}</p>
                        <p>Successful Sets: {syncResult.result.cards.successfulSets}</p>
                        <p>Failed Sets: {syncResult.result.cards.failedSets}</p>
                        <p>Total Cards: {syncResult.result.cards.totalCardsProcessed}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{syncResult.error?.message || 'Unknown error occurred'}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Price Updates Tab */}
        {activeTab === 'price' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Price Updates</h2>
            
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-purple-800">
                Update card prices with tiered prioritization. You can focus on high-value cards or update prices across all tiers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Manual Price Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Tier
                    </label>
                    <select
                      value={priceParams.tier}
                      onChange={(e) => setPriceParams({...priceParams, tier: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Cards</option>
                      <option value="high">High Value (&gt; $50)</option>
                      <option value="medium">Medium Value ($10 - $50)</option>
                      <option value="low">Low Value (&lt; $10)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Cards to Update
                    </label>
                    <input
                      type="number"
                      value={priceParams.limit}
                      onChange={(e) => setPriceParams({...priceParams, limit: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handlePriceUpdate}
                  disabled={priceUpdateInProgress}
                  className={`px-4 py-2 rounded ${
                    priceUpdateInProgress 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-purple-500 hover:bg-purple-600 text-white"
                  }`}
                >
                  {priceUpdateInProgress ? "Updating Prices..." : "Update Prices"}
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Scheduled Price Updates</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Run the scheduled price update system that prioritizes cards based on value tiers:
                  <ul className="list-disc ml-5 mt-2">
                    <li>High-value cards (&gt; $50): 20 cards</li>
                    <li>Medium-value cards ($10-$50): 15 cards</li>
                    <li>Low-value cards (&lt; $10): 10 cards</li>
                  </ul>
                </p>
                
                <div className="flex space-x-2">
                  <Link 
                    href="/api/test-price-schedule?mode=stats" 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded text-sm"
                    target="_blank"
                  >
                    View Stats
                  </Link>
                  <Link 
                    href="/api/test-price-schedule?mode=run" 
                    className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm"
                    target="_blank"
                  >
                    Run Scheduled Updates
                  </Link>
                </div>
              </div>
            </div>
            
            {priceResult && (
              <div className={`mt-6 p-4 rounded border ${
                priceResult.success 
                  ? "bg-green-100 border-green-400 text-green-700" 
                  : "bg-red-100 border-red-400 text-red-700"
              }`}>
                <h3 className="font-semibold mb-2">
                  {priceResult.success ? "Price Update Completed" : "Price Update Failed"}
                </h3>
                {priceResult.success ? (
                  <div>
                    <p>Tier: {priceResult.tier}</p>
                    <p>Cards Processed: {priceResult.cardsProcessed}</p>
                    <p>Successful Updates: {priceResult.successfulUpdates}</p>
                    <p>Failed Updates: {priceResult.failedUpdates}</p>
                    
                    {priceResult.results && priceResult.results.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Price Change Summary:</h4>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Card</th>
                                <th className="text-right p-2">Old Price</th>
                                <th className="text-right p-2">New Price</th>
                                <th className="text-right p-2">Change</th>
                              </tr>
                            </thead>
                            <tbody>
                              {priceResult.results.map((result: any, index: number) => (
                                <tr key={index} className="border-t">
                                  <td className="p-2">{result.cardName}</td>
                                  <td className="text-right p-2">${result.oldPrice?.toFixed(2) || 'N/A'}</td>
                                  <td className="text-right p-2">${result.newPrice.toFixed(2)}</td>
                                  <td className={`text-right p-2 ${
                                    result.priceChange > 0 ? 'text-green-600' : 
                                    result.priceChange < 0 ? 'text-red-600' : ''
                                  }`}>
                                    {result.priceChange > 0 ? '+' : ''}
                                    ${result.priceChange.toFixed(2)} 
                                    ({result.priceChangePercent > 0 ? '+' : ''}
                                    {result.priceChangePercent.toFixed(1)}%)
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{priceResult.error || 'Unknown error occurred'}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>
            
            {loading ? (
              <p>Loading statistics...</p>
            ) : dbStats ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-700">{dbStats.sets}</div>
                    <div className="text-gray-600">Total Sets</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-700">{dbStats.cards}</div>
                    <div className="text-gray-600">Total Cards</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-700">{dbStats.variations}</div>
                    <div className="text-gray-600">Card Variations</div>
                  </div>
                </div>
                
                {dbStats.setDistribution && dbStats.setDistribution.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Set Distribution</h3>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-2">Set ID</th>
                            <th className="text-right p-2">Card Count</th>
                            <th className="p-2">Distribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbStats.setDistribution.map((set: any, index: number) => {
                            const percentage = (set.card_count / dbStats.cards) * 100;
                            return (
                              <tr key={index} className="border-t">
                                <td className="p-2">{set.set_id}</td>
                                <td className="text-right p-2">{set.card_count}</td>
                                <td className="p-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className="bg-blue-600 h-2.5 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={fetchDatabaseStats}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded text-sm"
                  >
                    Refresh Statistics
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-red-600">Failed to load database statistics</p>
            )}
          </div>
        )}
        
        {/* Data Validation Tab */}
        {activeTab === 'validation' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Data Validation</h2>
            
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Validation Tools</h3>
              <p className="text-gray-600 mb-4">
                Verify the integrity and completeness of your card data. Run validation on all sets or select a specific set to validate.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={() => runDataValidation('all')}
                  disabled={validatingData}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm disabled:opacity-50"
                >
                  {validatingData && validationTarget === 'all' ? 'Validating...' : 'Validate All Data'}
                </button>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex border rounded">
                    <input
                      type="text"
                      placeholder="Enter set ID (e.g., 'sv1')"
                      className="flex-1 p-2 text-sm"
                      value={validationTarget !== 'all' ? validationTarget : ''}
                      onChange={(e) => setValidationTarget(e.target.value)}
                      disabled={validatingData}
                    />
                    <button
                      onClick={() => runDataValidation(validationTarget)}
                      disabled={validatingData || validationTarget === 'all' || !validationTarget}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 text-sm disabled:opacity-50"
                    >
                      {validatingData ? 'Validating...' : 'Validate Set'}
                    </button>
                  </div>
                </div>
              </div>
              
              {validationError && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
                  Error: {validationError}
                </div>
              )}
            </div>
            
            {validationData && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-3">
                  Validation Results {validationData.setId !== 'all' && <span>for Set: {validationData.setId}</span>}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{validationData.stats.totalSets}</div>
                    <div className="text-gray-600">Sets</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{validationData.stats.totalCards}</div>
                    <div className="text-gray-600">Cards</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{validationData.stats.cardsWithoutPrices}</div>
                    <div className="text-gray-600">Cards without Prices</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{validationData.stats.cardsWithoutImages}</div>
                    <div className="text-gray-600">Cards without Images</div>
                  </div>
                </div>
                
                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border p-3 rounded-lg">
                    <div className="text-sm font-semibold">Avg. Cards per Set</div>
                    <div className="text-xl">{validationData.stats.averageCardsPerSet.toFixed(1)}</div>
                  </div>
                  <div className="border p-3 rounded-lg">
                    <div className="text-sm font-semibold">Sets without Cards</div>
                    <div className="text-xl">{validationData.stats.setsWithoutCards}</div>
                  </div>
                  <div className="border p-3 rounded-lg">
                    <div className="text-sm font-semibold">Price Updates</div>
                    <div className="text-xl">{validationData.stats.oldestPriceUpdate ? 
                      `${new Date(validationData.stats.oldestPriceUpdate).toLocaleDateString()} - ${new Date(validationData.stats.newestPriceUpdate).toLocaleDateString()}` : 
                      'No price updates'}</div>
                  </div>
                </div>
                
                {/* Warnings */}
                {validationData.warnings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-yellow-700 mb-2">Warnings ({validationData.warnings.length})</h4>
                    <div className="border border-yellow-200 rounded-lg divide-y divide-yellow-200">
                      {validationData.warnings.map((warning: any, index: number) => (
                        <div key={index} className="p-3 bg-yellow-50">
                          <div className="font-medium">{warning.type}</div>
                          <div className="text-sm text-gray-700">{warning.message}</div>
                          {warning.affectedEntities && warning.affectedEntities.length > 0 && (
                            <div className="mt-2">
                              <details>
                                <summary className="text-sm cursor-pointer hover:text-blue-600">
                                  Show {warning.affectedEntities.length} affected items
                                </summary>
                                <ul className="mt-2 text-xs text-gray-600 max-h-40 overflow-y-auto pl-4">
                                  {warning.affectedEntities.map((entity: string, i: number) => (
                                    <li key={i}>{entity}</li>
                                  ))}
                                </ul>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Errors */}
                {validationData.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-red-700 mb-2">Errors ({validationData.errors.length})</h4>
                    <div className="border border-red-200 rounded-lg divide-y divide-red-200">
                      {validationData.errors.map((error: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50">
                          <div className="font-medium">{error.type}</div>
                          <div className="text-sm text-gray-700">{error.message}</div>
                          {error.affectedEntities && error.affectedEntities.length > 0 && (
                            <div className="mt-2">
                              <details>
                                <summary className="text-sm cursor-pointer hover:text-blue-600">
                                  Show {error.affectedEntities.length} affected items
                                </summary>
                                <ul className="mt-2 text-xs text-gray-600 max-h-40 overflow-y-auto pl-4">
                                  {error.affectedEntities.map((entity: string, i: number) => (
                                    <li key={i}>{entity}</li>
                                  ))}
                                </ul>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={() => runDataValidation(validationData.setId)}
                    disabled={validatingData}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded text-sm disabled:opacity-50"
                  >
                    {validatingData ? 'Refreshing...' : 'Refresh Results'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 