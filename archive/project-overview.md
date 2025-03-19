Project Overview
The platform is a Next.js application (v14 with App Router) for trading Pokémon cards with real-time pricing data
Currently in Phase 5: Codebase Cleanup & Optimization
Focuses on creating a centralized system for Pokémon TCG collectors in Costa Rica to showcase inventory and connect directly via WhatsApp
Tech Stack
Frontend: Next.js 14 (App Router)
Styling: Tailwind CSS & shadcn/ui
Database: PostgreSQL via Supabase
Type Safety: TypeScript
Authentication: Supabase Auth with Phone/SMS verification using Twilio
Deployment: Vercel
Database Structure
Uses PostgreSQL via Supabase with multiple schemas:
Main public schema (26 MB, 12 tables)
Auth schema (16 tables) for user authentication
Storage schema (5 tables) for file storage
Other utility schemas
Core Tables
cards (18,509 rows): Stores Pokémon card information
card_variations (71,234 rows): Stores card variations (holofoil, reverse holofoil, etc.)
sets (164 rows): Information about card sets
users: User profiles with contact information
collections: User's personal card collections
inventory: Cards available for trading/selling
wishlists: Cards users want to acquire
delivery_stores: Physical delivery locations
store_connections: Store-to-store delivery connections
Key Features
Admin dashboard for system monitoring and management
Real-time card price tracking from multiple sources
Automated card data synchronization with Pokémon TCG API
Interactive card search and filtering with advanced browsing capabilities
Price update scheduling and monitoring
Data validation tools for quality assurance
Set distribution analytics and visualization
User profiles with WhatsApp integration for direct communication
Development Approach
The project follows comprehensive best practices documented in best-practices.md
Emphasizes code modularity, separation of concerns, and type safety
Uses Supabase for both database and authentication
Integrates with the Pokémon TCG API for card data
Focuses on user connection rather than traditional marketplace transactions
Current Status
The database structure is fully set up with card data imported
Card data has been synchronized from the Pokémon TCG API (164 sets, ~18,500 cards)
Some synchronization issues were encountered and documented in sync-progress.md
The platform is ready for user accounts, collections, and trading functionality
User data has not yet been populated