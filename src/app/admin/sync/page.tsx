'use client';

import { useState } from 'react';
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

export default function SyncPage() {
  const [syncMode, setSyncMode] = useState<'full' | 'sets-only' | 'cards-only'>('full');
  const [syncSetId, setSyncSetId] = useState<string>('');
  const [syncBatchSize, setSyncBatchSize] = useState<number>(5);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState<any>(null);

  const handleSyncCards = async () => {
    setSyncInProgress(true);
    setSyncResult(null);
    
    try {
      const queryParams = new URLSearchParams({
        mode: syncMode,
        setId: syncSetId,
        limit: syncBatchSize.toString()
      });
      
      const response = await fetch(`/api/pokemon-tcg?${queryParams}`);
      const data = await response.json();
      
      setSyncResult({
        success: data.status === 'success',
        mode: syncMode,
        setId: syncSetId,
        executionTimeMs: data.executionTimeMs,
        result: data.result,
        error: data.error
      });
      
    } catch (error) {
      setSyncResult({
        success: false,
        error: { message: 'Failed to sync cards' }
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Synchronization</h1>
        <p className="text-muted-foreground mt-1">
          Keep your card database in sync with the Pokémon TCG API
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sync Configuration</CardTitle>
            <CardDescription>
              Configure how you want to synchronize your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Sync Mode</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={syncMode === 'full' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSyncMode('full')}
                >
                  Full Sync
                </Button>
                <Button 
                  variant={syncMode === 'sets-only' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSyncMode('sets-only')}
                >
                  Sets Only
                </Button>
                <Button 
                  variant={syncMode === 'cards-only' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSyncMode('cards-only')}
                >
                  Cards Only
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose what data to synchronize with the Pokémon TCG API
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Target Set ID (Optional)</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., sv1, swsh12"
                value={syncSetId}
                onChange={(e) => setSyncSetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to sync all sets
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Batch Size</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syncBatchSize}
                onChange={(e) => setSyncBatchSize(Number(e.target.value))}
                min={1}
                max={20}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of sets to process in a single batch (1-20)
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSyncCards} 
              disabled={syncInProgress}
              className="w-full"
            >
              {syncInProgress ? 'Syncing...' : 'Start Synchronization'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>
              Current synchronization status and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Current status:</span>
              <Badge variant={syncInProgress ? 'outline' : 'default'}>
                {syncInProgress ? 'Syncing...' : 'Ready'}
              </Badge>
            </div>
            
            {syncProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress: {syncProgress.processedSets} / {syncProgress.totalSets} sets</span>
                  <span>{Math.round((syncProgress.processedSets / syncProgress.totalSets) * 100)}%</span>
                </div>
                <Progress 
                  value={(syncProgress.processedSets / syncProgress.totalSets) * 100} 
                  className="h-2"
                />
                {syncProgress.currentSet && (
                  <p className="text-xs text-muted-foreground">
                    Currently processing: {syncProgress.currentSet}
                  </p>
                )}
              </div>
            )}
            
            {!syncProgress && !syncInProgress && (
              <div className="flex items-center justify-center h-32 border rounded-md border-dashed">
                <p className="text-muted-foreground text-sm">No active synchronization</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Synchronization Results
              <Badge variant={syncResult.success ? 'default' : 'destructive'}>
                {syncResult.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Sets processed:</p>
                  <p className="text-xl font-bold">{syncResult.setsProcessed || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cards added:</p>
                  <p className="text-xl font-bold">{syncResult.cardsAdded || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cards updated:</p>
                  <p className="text-xl font-bold">{syncResult.cardsUpdated || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Execution time:</p>
                  <p className="text-xl font-bold">{syncResult.executionTimeMs ? (syncResult.executionTimeMs / 1000).toFixed(2) + 's' : 'N/A'}</p>
                </div>
              </div>
              
              {syncResult.error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                  <p className="font-semibold">Error:</p>
                  <p>{syncResult.error.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
