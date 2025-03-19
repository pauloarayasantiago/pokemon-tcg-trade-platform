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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QueueStats {
  queuedItems: number;
  highPriorityItems: number;
  mediumPriorityItems: number;
  lowPriorityItems: number;
  estimatedTimeToComplete: number;
  recentlyProcessed?: any[];
}

export default function QueuePage() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchQueueStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/price-update/queue-stats');
      const data = await response.json();
      
      if (data.status === 'success') {
        setQueueStats(data.queueStats);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    fetchQueueStats();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchQueueStats();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval, autoRefresh]);

  const handleClearQueue = async () => {
    // This would be implemented with an API endpoint to clear the queue
    alert('Queue clearing functionality would be implemented here');
  };

  const handlePauseQueue = async () => {
    // This would be implemented with an API endpoint to pause the queue
    alert('Queue pausing functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage the price update queue
        </p>
      </div>
      
      <Separator />
      
      {/* Queue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Queue Status</CardTitle>
            <CardDescription>
              Current status of the price update queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {queueStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{queueStats.queuedItems}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{queueStats.highPriorityItems}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Medium Priority</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{queueStats.mediumPriorityItems}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Low Priority</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{queueStats.lowPriorityItems}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>High Priority</span>
                      <span>{Math.round((queueStats.highPriorityItems / queueStats.queuedItems) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(queueStats.highPriorityItems / queueStats.queuedItems) * 100} 
                      className="h-2 bg-muted/30"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Medium Priority</span>
                      <span>{Math.round((queueStats.mediumPriorityItems / queueStats.queuedItems) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(queueStats.mediumPriorityItems / queueStats.queuedItems) * 100} 
                      className="h-2 bg-muted/30"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Low Priority</span>
                      <span>{Math.round((queueStats.lowPriorityItems / queueStats.queuedItems) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(queueStats.lowPriorityItems / queueStats.queuedItems) * 100} 
                      className="h-2 bg-muted/30"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <p className="text-muted-foreground text-sm">
                  {loading ? 'Loading queue statistics...' : 'No queue data available'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estimated Completion</CardTitle>
            <CardDescription>
              Time to process all queued items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueStats ? (
              <div className="flex flex-col items-center justify-center h-32">
                <p className="text-4xl font-bold">
                  {queueStats.estimatedTimeToComplete}
                </p>
                <p className="text-muted-foreground">minutes</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border rounded-md border-dashed">
                <p className="text-muted-foreground text-sm">
                  {loading ? 'Loading...' : 'N/A'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Controls</CardTitle>
          <CardDescription>
            Manage queue operations and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Queue Operations</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePauseQueue}
                >
                  Pause Queue
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearQueue}
                  className="text-destructive hover:text-destructive"
                >
                  Clear Queue
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/prices'}
                >
                  Process Queue
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Refresh Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="autoRefresh" className="text-sm font-medium">
                    Auto-refresh
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor="refreshInterval" className="text-sm font-medium">
                    Refresh interval:
                  </label>
                  <select
                    id="refreshInterval"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                    disabled={!autoRefresh}
                  >
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                  </select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchQueueStats}
                  className="mt-2"
                >
                  Refresh Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recently Processed Items */}
      {queueStats?.recentlyProcessed && queueStats.recentlyProcessed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Processed Items</CardTitle>
            <CardDescription>
              Cards that have been recently processed by the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card ID</TableHead>
                  <TableHead>Set</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueStats.recentlyProcessed.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.cardId}</TableCell>
                    <TableCell>{item.setId}</TableCell>
                    <TableCell>{item.priority}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell className="text-right">{new Date(item.processedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
