import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSwitch } from '@/components/theme-switch';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      
      <Card className="w-full max-w-md border border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Pokémon TCG Platform</CardTitle>
          <CardDescription className="text-center">Development Navigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a module to work on or test:
          </p>
          
          <div className="grid gap-3">
            <Link href="/admin/dashboard" className="w-full">
              <Button variant="default" size="lg" className="w-full">
                Admin Dashboard
              </Button>
            </Link>
            
            <Link href="/inventory" className="w-full">
              <Button variant="outline" size="lg" className="w-full">
                Inventory System
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 mt-2 pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Pokémon TCG Trade Platform - Development Build
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
