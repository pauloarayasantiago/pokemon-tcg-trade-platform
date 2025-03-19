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
import { Separator } from '@/components/ui/separator';

interface ValidationResult {
  stats: {
    totalSets: number;
    totalCards: number;
    cardsWithoutPrices: number;
    cardsWithoutImages: number;
  };
  errors: Array<{
    type: string;
    message: string;
    affectedEntities?: string[];
  }>;
  warnings: Array<{
    type: string;
    message: string;
    affectedEntities?: string[];
  }>;
  setId?: string;
}

export default function TestingPage() {
  const [validationTarget, setValidationTarget] = useState<string>('all');
  const [validatingData, setValidatingData] = useState<boolean>(false);
  const [validationData, setValidationData] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [apiTestTarget, setApiTestTarget] = useState<string>('pokemon-tcg');
  const [apiTestInProgress, setApiTestInProgress] = useState<boolean>(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  
  const runDataValidation = async (target: string = 'all') => {
    try {
      setValidatingData(true);
      setValidationError(null);
      setValidationTarget(target);
      
      const endpoint = target === 'all' 
        ? '/api/data-validation' 
        : `/api/data-validation?setId=${target}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Validation failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setValidationData(data.results);
    } catch (error: any) {
      console.error('Data validation error:', error);
      setValidationError(error.message);
    } finally {
      setValidatingData(false);
    }
  };
  
  const runApiTest = async () => {
    try {
      setApiTestInProgress(true);
      setApiTestResult(null);
      
      let endpoint = '';
      switch (apiTestTarget) {
        case 'pokemon-tcg':
          endpoint = '/api/pokemon-tcg/health';
          break;
        case 'price-update':
          endpoint = '/api/price-update/health';
          break;
        case 'supabase':
          endpoint = '/api/supabase';
          break;
        default:
          endpoint = '/api/pokemon-tcg/health';
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setApiTestResult({
        endpoint,
        status: data.status,
        message: data.message,
        timestamp: data.timestamp,
        data: data
      });
    } catch (error: any) {
      setApiTestResult({
        endpoint: apiTestTarget,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setApiTestInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Testing Tools</h1>
        <p className="text-muted-foreground mt-1">
          Tools for validating data integrity and testing system functionality
        </p>
      </div>
      
      <Separator />
      
      {/* Data Validation Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Data Validation</h2>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Validate the integrity of your card database. Check for inconsistencies, missing data, and ensure proper relationships between sets and cards.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Validate All Data</CardTitle>
              <CardDescription>
                Check the entire database for inconsistencies. This may take some time for large datasets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will scan your entire database and check for:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mb-4">
                <li>Missing card data</li>
                <li>Inconsistent relationships</li>
                <li>Outdated price information</li>
                <li>Missing image references</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => runDataValidation('all')}
                disabled={validatingData}
                className="w-full"
              >
                {validatingData && validationTarget === 'all' ? 'Validating...' : 'Validate All Data'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Validate Specific Set</CardTitle>
              <CardDescription>
                Enter a set ID to validate only that specific set
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Set ID</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter set ID (e.g., 'sv1')"
                  value={validationTarget !== 'all' ? validationTarget : ''}
                  onChange={(e) => setValidationTarget(e.target.value)}
                  disabled={validatingData}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Specify a set ID to validate only that set's data
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => runDataValidation(validationTarget)}
                disabled={validatingData || validationTarget === 'all' || !validationTarget}
                className="w-full"
              >
                {validatingData ? 'Validating...' : 'Validate Set'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {validationError && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-3 rounded mb-4">
            Error: {validationError}
          </div>
        )}
        
        {validationData && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              Validation Results {validationData.setId && <span>for Set: {validationData.setId}</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{validationData.stats.totalSets || 0}</div>
                  <div className="text-muted-foreground">Sets</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{validationData.stats.totalCards || 0}</div>
                  <div className="text-muted-foreground">Cards</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{validationData.stats.cardsWithoutPrices || 0}</div>
                  <div className="text-muted-foreground">Cards without Prices</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">{validationData.stats.cardsWithoutImages || 0}</div>
                  <div className="text-muted-foreground">Cards without Images</div>
                </CardContent>
              </Card>
            </div>
            
            {validationData.errors && validationData.errors.length > 0 && (
              <Card className="mb-6 border-red-200 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-600 dark:text-red-400">Validation Errors ({validationData.errors.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {validationData.errors.map((error, i) => (
                      <li key={i} className="text-red-600 dark:text-red-400">
                        <span className="font-semibold">{error.type}:</span> {error.message}
                        {error.affectedEntities && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Affected: {error.affectedEntities.join(', ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {validationData.warnings && validationData.warnings.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-600 dark:text-yellow-400">Validation Warnings ({validationData.warnings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {validationData.warnings.map((warning, i) => (
                      <li key={i} className="text-yellow-600 dark:text-yellow-400">
                        <span className="font-semibold">{warning.type}:</span> {warning.message}
                        {warning.affectedEntities && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Affected: {warning.affectedEntities.join(', ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* API Testing Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">API Testing</h2>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Test the connectivity and functionality of various API endpoints used by the system.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">API Test Controls</CardTitle>
              <CardDescription>
                Select an API endpoint to test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">API Endpoint</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={apiTestTarget}
                  onChange={(e) => setApiTestTarget(e.target.value)}
                  disabled={apiTestInProgress}
                >
                  <option value="pokemon-tcg">Pokémon TCG API</option>
                  <option value="price-update">Price Update Service</option>
                  <option value="supabase">Supabase Database</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the API endpoint you want to test
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={runApiTest}
                disabled={apiTestInProgress}
                className="w-full"
              >
                {apiTestInProgress ? 'Testing...' : 'Run API Test'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Test Results</CardTitle>
              <CardDescription>
                Results of the API test will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiTestResult ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Endpoint:</span>
                    <span className="text-sm">{apiTestResult.endpoint}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={apiTestResult.status === 'success' ? 'success' : 'destructive'}>
                      {apiTestResult.status === 'success' ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="text-sm">{apiTestResult.timestamp}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Message:</span>
                    <p className="text-sm mt-1 p-2 bg-muted/30 rounded">
                      {apiTestResult.message}
                    </p>
                  </div>
                  
                  {apiTestResult.data && (
                    <div>
                      <span className="text-sm font-medium">Response Data:</span>
                      <pre className="text-xs mt-1 p-2 bg-muted/30 rounded overflow-auto max-h-40">
                        {JSON.stringify(apiTestResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
                  <p className="text-muted-foreground text-sm">
                    {apiTestInProgress ? 'Running test...' : 'No test results yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
