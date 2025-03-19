import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-muted/20 border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Pokémon TCG Platform</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your Pokémon card collection with real-time pricing data and stay up to date with the latest releases.
            </p>
            <p className="text-xs text-muted-foreground">
              Phase 5: Codebase Cleanup & Optimization
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Pokémon TCG Platform. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Pokémon and its trademarks are ©1995-{new Date().getFullYear()} Nintendo, Creatures, and GAMEFREAK.
            <br className="hidden md:inline" />
            This website is not affiliated with, sponsored or endorsed by, or in any way associated with Pokémon or its owners.
          </p>
        </div>
      </div>
    </footer>
  );
} 