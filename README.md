# Pokémon TCG Trade Platform

A Next.js application for trading Pokémon cards with real-time pricing data.

## Project Status

Currently in Phase 5: Codebase Cleanup & Optimization
- Consolidation of testing functionality into unified admin dashboard
- Simplified API endpoint structure
- Removal of deprecated code and test pages
- Enhanced UI components with shadcn/ui integration
- Advanced card browser with filtering and sorting capabilities
- Improved card image rendering with robust error handling and fallbacks
- Fixed Tailwind CSS configuration for proper custom utility class recognition

## Features

- Admin dashboard for system monitoring and management
- Real-time card price tracking from multiple sources
- Automated card data synchronization with Pokémon TCG API
- Database-driven card information with TypeScript type safety
- Interactive card search and filtering
- Price update scheduling and monitoring
- Data validation tools and quality assurance
- Advanced card browser with set filtering, rarity filtering, and price range filtering
- Sortable card listings with pagination support
- Set distribution analytics and visualization
- Flexible card viewing with table/grid views
- Color-coded price freshness indicators
- Enhanced filtering by type, generation, and card era
- Robust card image rendering with error handling and appropriate fallbacks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Type Safety**: TypeScript
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## API Endpoints

The application provides the following API endpoints:

- `/api/supabase` - Database health check and statistics
- `/api/pokemon-tcg` - Pokémon TCG API integration for card syncing
- `/api/price-update` - Price update service management
- `/api/card-search` - Advanced card search functionality
- `/api/data-validation` - Card data validation utilities
- `/api/price-schedule` - Price update scheduling
- `/api/admin/cards` - Admin card browsing and management API

## Application Pages

- `/` - Updated main landing page: A simplified module with navigation buttons to the Inventory System and Admin Dashboard, a ThemeSwitch in the top-right corner, and a footer indicating a development build.
- `/admin/dashboard` - Main admin dashboard with monitoring and management tools
  - Overview tab - System health and statistics
  - Cards tab - Card database management and syncing
  - Prices tab - Price update monitoring and triggering
  - Sets tab - Set information and statistics
  - Testing tab - Data validation and quality assurance
  - Logs tab - System logs and activity monitoring
- `/admin/card-browser` - Advanced card browser with filtering and sorting capabilities
  - Search by card name
  - Filter by set, rarity, type, generation, era and price range
  - Sort by name, set, price, or update date
  - Pagination for large result sets
  - Table and grid view options
  - Set distribution analytics and visualization
  - Color-coded freshness indicators for price data
  - Robust image rendering with fallbacks for missing or broken images

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   cp .env.example .env.local
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin functions)
- `POKEMON_TCG_API_KEY` - API key for the Pokémon TCG API
- `NEXT_PUBLIC_SITE_URL` - Public URL of your site

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Pokémon TCG API](https://pokemontcg.io/) for providing card data
- [Supabase](https://supabase.io/) for the backend infrastructure
- [Next.js](https://nextjs.org/) for the frontend framework
- [shadcn/ui](https://ui.shadcn.com/) for UI components