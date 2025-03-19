'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  priceStats?: {
    totalCardsWithPrices: number;
    highValueCards: number;
    mediumValueCards: number;
    lowValueCards: number;
    averagePriceAge: number;
  };
}

interface QueueStats {
  queuedItems: number;
  highPriorityItems: number;
  mediumPriorityItems: number;
  lowPriorityItems: number;
  estimatedTimeToComplete: number;
}

export default function AdminDashboardPage() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkApiStatuses();
    fetchDatabaseStats();
    fetchQueueStats();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchQueueStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const checkApiStatuses = async () => {
    setLoading(true);
    const statuses: ApiStatus[] = [];

    try {
      // Check Supabase connection
      const response = await fetch('/api/supabase');
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

      // Check Pokemon TCG API
      const tcgResponse = await fetch('/api/pokemon-tcg/health');
      const tcgData = await tcgResponse.json();
      statuses.push({
        endpoint: 'Pokemon TCG API',
        status: tcgData.status === 'success' ? 'success' : 'error',
        message: tcgData.message,
        timestamp: tcgData.timestamp
      });

      // Check Price Update Service
      const priceResponse = await fetch('/api/price-update/health');
      const priceData = await priceResponse.json();
      statuses.push({
        endpoint: 'Price Update Service',
        status: priceData.status === 'success' ? 'success' : 'error',
        message: priceData.message,
        timestamp: priceData.timestamp
      });

    } catch (error) {
      console.error('Error checking API statuses:', error);
    }

    setApiStatuses(statuses);
    setLoading(false);
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/supabase');
      const data = await response.json();
      
      if (data.status === 'success' && data.stats) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/price-update/queue-stats');
      const data = await response.json();
      
      if (data.status === 'success') {
        setQueueStats(data.queueStats);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your Pokémon TCG platform status and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchDatabaseStats} className="border border-border/40 hover:bg-background/80">
            Refresh Status
          </Button>
          <Button variant="outline" size="sm" onClick={checkApiStatuses} className="border border-border/40 hover:bg-background/80">
            Refresh Stats
          </Button>
        </div>
      </div>
      
      <Separator />

      {/* System Status Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {apiStatuses.map((api, index) => (
            <Card key={index} className="overflow-hidden border-border/50">
              <CardHeader className="pb-2 bg-muted/30">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{api.endpoint}</span>
                  <Badge variant={api.status === 'success' ? 'success' : 'destructive'} className="ml-2">
                    {api.status === 'success' ? 'Online' : 'Offline'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {api.message}
                  <br />
                  <span className="text-xs opacity-70">
                    Last checked: {api.timestamp || 'N/A'}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Database Stats Summary */}
      {dbStats ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Database Overview</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col bg-card/40 p-3 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Total Sets</span>
                  <span className="text-3xl font-bold mt-1">{dbStats.sets}</span>
                </div>
                <div className="flex flex-col bg-card/40 p-3 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Total Cards</span>
                  <span className="text-3xl font-bold mt-1">{dbStats.cards}</span>
                </div>
                <div className="flex flex-col bg-card/40 p-3 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Variations</span>
                  <span className="text-3xl font-bold mt-1">{dbStats.variations}</span>
                </div>
                {dbStats.priceStats && (
                  <div className="flex flex-col bg-card/40 p-3 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">Cards with Prices</span>
                    <span className="text-3xl font-bold mt-1">{dbStats.priceStats.totalCardsWithPrices}</span>
                    <div className="mt-2">
                      <Progress value={(dbStats.priceStats.totalCardsWithPrices / dbStats.cards) * 100} className="h-2 bg-muted/30" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full" />
        </div>
      )}
      
      {/* Recent Activity & Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sets */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Sets</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              {dbStats && dbStats.setDistribution ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Set</TableHead>
                      <TableHead className="text-right">Cards</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStats.setDistribution.slice(0, 5).map((set, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{set.name || set.id}</TableCell>
                        <TableCell className="text-right">{set.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Queue Status */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Price Update Queue</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              {queueStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{queueStats.queuedItems}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Est. Completion</p>
                      <p className="text-2xl font-bold">{queueStats.estimatedTimeToComplete} min</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Priority</span>
                      <span className="font-medium">{queueStats.highPriorityItems}</span>
                    </div>
                    <Progress value={(queueStats.highPriorityItems / queueStats.queuedItems) * 100} className="h-2 bg-muted/30" />
                    
                    <div className="flex justify-between text-sm mt-2">
                      <span>Medium Priority</span>
                      <span className="font-medium">{queueStats.mediumPriorityItems}</span>
                    </div>
                    <Progress value={(queueStats.mediumPriorityItems / queueStats.queuedItems) * 100} className="h-2 bg-muted/30" />
                    
                    <div className="flex justify-between text-sm mt-2">
                      <span>Low Priority</span>
                      <span className="font-medium">{queueStats.lowPriorityItems}</span>
                    </div>
                    <Progress value={(queueStats.lowPriorityItems / queueStats.queuedItems) * 100} className="h-2 bg-muted/30" />
                  </div>
                  
                  <div className="flex justify-end">
                    <Link href="/admin/price-updates">
                      <Button variant="outline" size="sm">
                        Manage Queue
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/cards">
            <Card className="hover:bg-muted/10 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <h3 className="font-medium">Manage Cards</h3>
                <p className="text-sm text-muted-foreground mt-1">Add, edit, and organize your card database</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/card-browser">
            <Card className="hover:bg-muted/10 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="font-medium">Browse Cards</h3>
                <p className="text-sm text-muted-foreground mt-1">Search and view cards in your collection</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/sync">
            <Card className="hover:bg-muted/10 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </div>
                <h3 className="font-medium">Sync Database</h3>
                <p className="text-sm text-muted-foreground mt-1">Update your database with the latest card data</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
