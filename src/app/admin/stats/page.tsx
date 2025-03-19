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

export default function StatsPage() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/supabase');
      const data = await response.json();
      
      if (data.status === 'success' && data.stats) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Detailed statistics and insights about your card database
        </p>
      </div>
      
      <Separator />
      
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Time Range:</span>
          <div className="flex rounded-md overflow-hidden border border-input">
            <Button 
              variant={timeRange === 'day' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setTimeRange('day')}
            >
              Day
            </Button>
            <Button 
              variant={timeRange === 'week' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setTimeRange('all')}
            >
              All Time
            </Button>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchDatabaseStats}>
          Refresh Stats
        </Button>
      </div>
      
      {/* Stats Overview */}
      {dbStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collection Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Statistics</CardTitle>
              <CardDescription>
                Overview of your card collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Total Sets</dt>
                  <dd className="mt-1 text-2xl font-semibold">{dbStats.sets}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Total Cards</dt>
                  <dd className="mt-1 text-2xl font-semibold">{dbStats.cards}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Variations</dt>
                  <dd className="mt-1 text-2xl font-semibold">{dbStats.variations}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Cards per Set</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {(dbStats.cards / dbStats.sets).toFixed(1)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          {/* Price Stats */}
          {dbStats.priceStats && (
            <Card>
              <CardHeader>
                <CardTitle>Price Analysis</CardTitle>
                <CardDescription>
                  Statistics about card prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Cards with Prices</dt>
                    <dd className="mt-1 text-2xl font-semibold">{dbStats.priceStats.totalCardsWithPrices}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Coverage</dt>
                    <dd className="mt-1 text-2xl font-semibold">
                      {((dbStats.priceStats.totalCardsWithPrices / dbStats.cards) * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">High Value Cards</dt>
                    <dd className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                      {dbStats.priceStats.highValueCards}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Price Age (days)</dt>
                    <dd className="mt-1 text-2xl font-semibold">
                      {dbStats.priceStats.averagePriceAge.toFixed(1)}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Price Distribution</h3>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${(dbStats.priceStats.highValueCards / dbStats.priceStats.totalCardsWithPrices) * 100}%` }}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${(dbStats.priceStats.mediumValueCards / dbStats.priceStats.totalCardsWithPrices) * 100}%` }}
                    />
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${(dbStats.priceStats.lowValueCards / dbStats.priceStats.totalCardsWithPrices) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>High: {((dbStats.priceStats.highValueCards / dbStats.priceStats.totalCardsWithPrices) * 100).toFixed(1)}%</span>
                    <span>Medium: {((dbStats.priceStats.mediumValueCards / dbStats.priceStats.totalCardsWithPrices) * 100).toFixed(1)}%</span>
                    <span>Low: {((dbStats.priceStats.lowValueCards / dbStats.priceStats.totalCardsWithPrices) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
          <p className="text-muted-foreground text-sm">
            {loading ? 'Loading statistics...' : 'No statistics available'}
          </p>
        </div>
      )}
      
      {/* Set Distribution */}
      {dbStats?.setDistribution && dbStats.setDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Set Distribution</CardTitle>
            <CardDescription>
              Card distribution across different sets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set ID</TableHead>
                    <TableHead>Set Name</TableHead>
                    <TableHead>Card Count</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbStats.setDistribution.map((set, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{set.id}</TableCell>
                      <TableCell>{set.name || 'N/A'}</TableCell>
                      <TableCell>{set.count}</TableCell>
                      <TableCell className="w-1/3">
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${(set.count / Math.max(...(dbStats.setDistribution?.map(s => s.count) || [1]))) * 100}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Activity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Metrics</CardTitle>
          <CardDescription>
            System activity and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">API Requests</h3>
              <p className="text-3xl font-bold">2,458</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-green-500">↑ 12%</span> from last {timeRange}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Price Updates</h3>
              <p className="text-3xl font-bold">847</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-green-500">↑ 8%</span> from last {timeRange}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Database Operations</h3>
              <p className="text-3xl font-bold">12,105</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-red-500">↓ 3%</span> from last {timeRange}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-muted-foreground italic">
              Note: Activity metrics are simulated for demonstration purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
