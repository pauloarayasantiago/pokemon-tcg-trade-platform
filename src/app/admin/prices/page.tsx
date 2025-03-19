'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function PricesPage() {
  const [priceUpdateCardId, setPriceUpdateCardId] = useState<string>('');
  const [priceUpdateBatchSize, setPriceUpdateBatchSize] = useState<number>(50);
  const [priceUpdateLimit, setPriceUpdateLimit] = useState<number>(100);
  const [priceUpdatePriorityOnly, setPriceUpdatePriorityOnly] = useState<boolean>(false);
  const [priceUpdateInProgress, setPriceUpdateInProgress] = useState<boolean>(false);
  const [priceUpdateResult, setPriceUpdateResult] = useState<any>(null);
  const [priceUpdateSetId, setPriceUpdateSetId] = useState<string>('');
  const [priceAgeThreshold, setPriceAgeThreshold] = useState<number>(7);
  const [priceStats, setPriceStats] = useState<any>(null);

  const handlePriceUpdate = async () => {
    setPriceUpdateInProgress(true);
    setPriceUpdateResult(null);
    
    try {
      const queryParams = new URLSearchParams({
        cardId: priceUpdateCardId,
        batchSize: priceUpdateBatchSize.toString(),
        limit: priceUpdateLimit.toString(),
        priorityOnly: priceUpdatePriorityOnly.toString()
      });
      
      const response = await fetch(`/api/price-update?${queryParams}`);
      const data = await response.json();
      
      setPriceUpdateResult({
        success: data.status === 'success',
        cardsProcessed: data.cardsProcessed,
        successfulUpdates: data.successfulUpdates,
        failedUpdates: data.failedUpdates,
        queueStats: data.queueStats
      });
      
    } catch (error) {
      setPriceUpdateResult({
        success: false,
        error: { message: 'Failed to update prices' }
      });
    } finally {
      setPriceUpdateInProgress(false);
    }
  };

  const fetchPriceStats = async () => {
    try {
      const response = await fetch('/api/supabase');
      const data = await response.json();
      
      if (data.status === 'success' && data.stats && data.stats.priceStats) {
        setPriceStats(data.stats.priceStats);
      }
    } catch (error) {
      console.error('Error fetching price stats:', error);
    }
  };

  // Fetch price stats on component mount
  useEffect(() => {
    fetchPriceStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Price Updates</h1>
        <p className="text-muted-foreground mt-1">
          Manage and update price data for your Pokémon card collection
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Update Controls</CardTitle>
            <CardDescription>
              Configure and trigger price updates for your cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Target Card ID (Optional)</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., sv1-1, swsh12-25"
                value={priceUpdateCardId}
                onChange={(e) => setPriceUpdateCardId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to update based on other criteria
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Target Set ID (Optional)</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., sv1, swsh12"
                value={priceUpdateSetId}
                onChange={(e) => setPriceUpdateSetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to update all sets
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Price Age Threshold (days)</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priceAgeThreshold}
                onChange={(e) => setPriceAgeThreshold(Number(e.target.value))}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cards with prices older than this will be updated
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Batch Size</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priceUpdateBatchSize}
                onChange={(e) => setPriceUpdateBatchSize(Number(e.target.value))}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of cards to process in a single batch (1-100)
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Update Limit</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priceUpdateLimit}
                onChange={(e) => setPriceUpdateLimit(Number(e.target.value))}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of cards to update in this run
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="priorityOnly"
                checked={priceUpdatePriorityOnly}
                onChange={(e) => setPriceUpdatePriorityOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="priorityOnly" className="text-sm font-medium">
                Priority Cards Only
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePriceUpdate}
              disabled={priceUpdateInProgress}
              className="w-full"
            >
              {priceUpdateInProgress ? 'Updating Prices...' : 'Update Prices'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Price Statistics</CardTitle>
            <CardDescription>
              Overview of your card price data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {priceStats ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Coverage:</span>
                    <span>{priceStats.coveragePercentage || 0}%</span>
                  </div>
                  <Progress 
                    value={priceStats.coveragePercentage || 0} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {priceStats.totalCardsWithPrices || 0} of {priceStats.totalCards || 0} cards have price data
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground">High Value</span>
                    <span className="text-xl font-bold">{priceStats.highValueCards || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground">Medium Value</span>
                    <span className="text-xl font-bold">{priceStats.mediumValueCards || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground">Low Value</span>
                    <span className="text-xl font-bold">{priceStats.lowValueCards || 0}</span>
                  </div>
                </div>
                
                <div className="pt-1">
                  <p className="text-sm">
                    <span className="font-medium">Average price age: </span>
                    <span className={priceStats.averagePriceAge > 14 ? 'text-destructive' : ''}>
                      {priceStats.averagePriceAge?.toFixed(1) || 'N/A'} days
                    </span>
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={fetchPriceStats}>
                    Refresh Stats
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <p className="text-muted-foreground text-sm">Loading price statistics...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Price Update Results */}
      {priceUpdateResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Price Update Results
              <Badge variant={priceUpdateResult.success ? 'default' : 'destructive'}>
                {priceUpdateResult.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Cards Processed:</p>
                  <p className="text-xl font-bold">{priceUpdateResult.cardsProcessed || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Successful Updates:</p>
                  <p className="text-xl font-bold">{priceUpdateResult.successfulUpdates || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Failed Updates:</p>
                  <p className="text-xl font-bold">{priceUpdateResult.failedUpdates || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Success Rate:</p>
                  <p className="text-xl font-bold">
                    {priceUpdateResult.cardsProcessed ? 
                      ((priceUpdateResult.successfulUpdates / priceUpdateResult.cardsProcessed) * 100).toFixed(1) + '%' 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              {priceUpdateResult.error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                  <p className="font-semibold">Error:</p>
                  <p>{priceUpdateResult.error.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
