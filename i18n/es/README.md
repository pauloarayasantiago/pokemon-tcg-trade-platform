---
title: Plataforma de Intercambio de Cartas Pokémon TCG
version: 0.7.1
updated: '2023-11-18'
last_updated: '2023-11-18'
repository: 'https://github.com/username/pokemontcg-trade-platform'
tech_stack:
  next.js: 14.0.0
  react: 18.2.0
  typescript: 5.3.3
  supabase: 2.39.3
  tailwind: 3.4.0
  shadcn_ui: 0.5.0
status: In Development
description: 'Una aplicación web para coleccionar, gestionar e intercambiar cartas Pokémon'
language: es
original_file: README.md
translated: true
translation_date: '2025-03-18'
---
# Pokémon TCG Trade Platform

<purpose>
A web application for trading Pokémon cards with real-time pricing data, designed specifically for collectors in Costa Rica to showcase inventory and connect directly via WhatsApp. The platform acts as a centralized system for connecting buyers and sellers rather than a traditional marketplace with payment processing.
</purpose>

## System Architecture

```mermaid
graph TD
    subgraph Frontend
        UI[User Interface] --> Components[React Components]
        Components --> Hooks[Custom Hooks]
        Hooks --> Services[Frontend Services]
    end

    subgraph Backend
        API[Next.js API Routes] --> Controllers[Controllers]
        Controllers --> Services2[Backend Services]
        Services2 --> DBAccess[Database Access Layer]
    end

    subgraph "External Services"
        PokemonTCG[Pokémon TCG API]
        WhatsApp[WhatsApp Business API]
        Supabase[Supabase Backend]
    end

    subgraph "Storage & Authentication"
        Auth[Authentication]
        Database[(Database)]
        Storage[File Storage]
    end

    Services --> API
    DBAccess --> Supabase
    Services2 --> PokemonTCG
    Services2 --> WhatsApp
    Supabase --- Auth
    Supabase --- Database
    Supabase --- Storage

    style Frontend fill:#f9f9ff,stroke:#9999ff,stroke-width:2px
    style Backend fill:#f9fff9,stroke:#99ff99,stroke-width:2px
    style "External Services" fill:#fff9f9,stroke:#ff9999,stroke-width:2px
    style "Storage & Authentication" fill:#ffffd0,stroke:#ffff00,stroke-width:2px
```

## Project Status

<status>
Currently in Phase 5: Codebase Cleanup & Optimization
- Consolidation of testing functionality into unified admin dashboard
- Simplified API endpoint structure
- Removal of deprecated code and test pages
- Enhanced UI components with shadcn/ui integration
- Advanced card browser with filtering and sorting capabilities
- Improved card image rendering with robust error handling and fallbacks
- Fixed Tailwind CSS configuration for proper custom utility class recognition
</status>

## Features

<features>
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
- WhatsApp integration for direct communication between collectors
- User profiles with collection management
</features>

## Tech Stack

<tech_stack>
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Type Safety**: TypeScript
- **Authentication**: Supabase Auth with Phone/SMS verification using Twilio
- **Deployment**: Vercel
</tech_stack>

## API Endpoints

<api_endpoints>
The application provides the following API endpoints:

- `/api/supabase` - Database health check and statistics
- `/api/pokemon-tcg` - Pokémon TCG API integration for card syncing
- `/api/price-update` - Price update service management
- `/api/card-search` - Advanced card search functionality
- `/api/data-validation` - Card data validation utilities
- `/api/price-schedule` - Price update scheduling
- `/api/admin/cards` - Admin card browsing and management API
- `/api/users` - User profile management
- `/api/collections` - User collection management
- `/api/inventory` - Trading inventory management
- `/api/wishlist` - User wishlist management
- `/api/delivery` - Delivery store network data
</api_endpoints>

## Application Pages

<application_pages>
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
- `/profile/[slug]` - User profile page showing their collection and trading inventory
- `/collections` - Personal collection management interface
- `/trade` - Trading inventory management interface
- `/search` - Advanced card search interface for users
- `/wishlist` - User wishlist management interface
</application_pages>

## Getting Started

<installation_steps>
1. Clone the repository:
   ```bash
   git clone https://github.com/username/pokemontcg-trade-platform.git
   cd pokemontcg-trade-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
</installation_steps>

## Environment Variables

<environment_variables>
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin functions)
- `POKEMON_TCG_API_KEY` - API key for the Pokémon TCG API
- `NEXT_PUBLIC_SITE_URL` - Public URL of your site
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS verification
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number for sending SMS
</environment_variables>

## Directory Structure

<directory_structure>
- `src/app/` - Next.js application routes and pages
  - `api/` - API route handlers
  - `admin/` - Admin interface components
  - `profile/` - User profile pages
  - `collections/` - Collection management pages
  - `trade/` - Trading interface
  - `search/` - Card search pages
  - `wishlist/` - Wishlist management
- `src/components/` - Reusable React components
  - `ui/` - Base UI components from shadcn/ui
  - `providers/` - Context providers
  - `cards/` - Card-related components
  - `forms/` - Form components
  - `layouts/` - Layout components
  - `shared/` - Shared utility components
- `src/lib/` - Utility functions and services
  - `services/` - API service functions
  - `utils/` - Utility functions
  - `types/` - TypeScript type definitions
  - `constants/` - Application constants
  - `hooks/` - Custom React hooks
  - `supabase/` - Supabase client and utilities
- `docs/` - Documentation files
  - `api-reference.md` - API documentation
  - `component-catalog.md` - Component documentation
  - `enhanced-database-documentation.md` - Database documentation
  - `card-synchronization-process.md` - Sync process documentation
  - `inventory-management/` - Inventory management documentation
  - `user-trading-flow.md` - Trading flow documentation
  - `whatsapp-integration.md` - WhatsApp integration documentation
- `public/` - Static assets
</directory_structure>

## Development Commands

<development_commands>
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run type-check` - Check TypeScript types
- `npm run sync-cards` - Sync card data from Pokémon TCG API
- `npm run update-prices` - Update card prices
</development_commands>

## Documentation

<documentation>
Comprehensive documentation is available in the `docs/` directory:

- [API Reference](docs/api-reference.md)
- [Component Catalog](docs/component-catalog.md)
- [Database Documentation](docs/enhanced-database-documentation.md)
- [Card Synchronization Process](docs/card-synchronization-process.md)
- [User Trading Flow](docs/user-trading-flow.md)
- [WhatsApp Integration](docs/whatsapp-integration.md)
- [Inventory Management](docs/inventory-management/overview.md)
</documentation>

## Contributing

<contributing>
1. Create a feature branch
2. Make your changes
3. Submit a pull request

Please refer to [best-practices.md](docs/best-practices.md) for coding standards and guidelines.
</contributing>

## License

<license>
This project is licensed under the MIT License - see the LICENSE file for details.
</license>

## Acknowledgments

<acknowledgments>
- [Pokémon TCG API](https://pokemontcg.io/) for providing card data
- [Supabase](https://supabase.io/) for the backend infrastructure
- [Next.js](https://nextjs.org/) for the frontend framework
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Twilio](https://www.twilio.com/) for SMS verification services
</acknowledgments>
