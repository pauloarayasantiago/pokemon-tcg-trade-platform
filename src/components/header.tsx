"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeSwitch } from '@/components/theme-switch';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center text-white font-bold shadow-sm">
            <span className="text-lg">P</span>
          </div>
          <Link href="/" className="text-lg font-semibold text-foreground">
            Pokémon TCG Platform
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link 
            href="/admin/dashboard" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/admin/dashboard") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeSwitch />
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Admin Dashboard
            </Button>
          </Link>
          <Button variant="default" size="sm">
            Login
          </Button>
        </div>
      </div>
    </header>
  );
} 