"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeSwitch } from '@/components/theme-switch';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const isRouteActive = (route: string) => {
    return pathname.startsWith(route);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-primary to-yellow-500 flex items-center justify-center text-white font-bold shadow-md">
              <span className="text-lg">P</span>
            </div>
            <Link href="/" className="text-lg font-semibold text-foreground tracking-tight">
              Pokémon TCG Platform
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <ThemeSwitch />
            <Button size="sm" variant="outline" className="font-medium">
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Admin Content Area */}
      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background/90 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col gap-1.5 p-5">
            {/* Dashboard Section */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Dashboard</p>
            
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/dashboard') && !pathname.includes('/admin/dashboard/') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Overview
            </Link>
            
            <Separator className="my-3" />
            
            {/* Card Management Section */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Card Management</p>
            
            <Link
              href="/admin/card-browser"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/card-browser') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Browse Cards
            </Link>
            
            <Link
              href="/admin/cards"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/cards') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Manage Cards
            </Link>
            
            <Separator className="my-3" />
            
            {/* Data Operations Section */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Data Operations</p>
            
            <Link
              href="/admin/sync"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/sync') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Database Sync
            </Link>
            
            <Link
              href="/admin/prices"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/prices') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2v20M2 12h20" />
              </svg>
              Price Updates
            </Link>
            
            <Link
              href="/admin/queue"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/queue') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h4" />
                <path d="M6 12h12" />
                <path d="M6 16h8" />
              </svg>
              Queue Management
            </Link>
            
            <Separator className="my-3" />
            
            {/* System Section */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">System</p>
            
            <Link
              href="/admin/stats"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/stats') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M3 3v18h18" />
                <path d="M18 9l-6-6-6 6" />
                <path d="M6 12h12" />
              </svg>
              Analytics
            </Link>
            
            <Link
              href="/admin/testing"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all",
                isRouteActive('/admin/testing') && "text-foreground bg-card shadow-sm"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M9 2L2 9l9 9 9-9-9-9z" />
                <path d="M4 14l8 8 8-8" />
              </svg>
              Testing Tools
            </Link>
          </div>
        </aside>
        
        {/* Mobile Sidebar Toggle (only shown on small screens) */}
        <div className="md:hidden flex items-center border-b border-border py-3 px-4 bg-background">
          <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
            <span>Dashboard Menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Button>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden bg-muted/5 pb-12">
          <div className="container px-5 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
