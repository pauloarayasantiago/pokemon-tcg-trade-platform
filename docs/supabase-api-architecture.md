---
title: Supabase Api Architecture
type: technical-document
description: Documentation for Supabase Api Architecture
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-19'
status: draft
category: documentation
has_mermaid: true
---
---
title: Supabase Api Architecture
version: 1.0.0
last_updated: '2025-03-24'
status: Active
tags:
  - documentation
has_mermaid: true
---

# Supabase and API Architecture

This document provides a detailed overview of the Supabase integration and API architecture in the Pokémon TCG Trade Platform. It serves as a reference for developers working on the project.

## Table of Contents
- [Database Schema](#database-schema)
- [Supabase Integration](#supabase-integration)
- [API System](#api-system)
- [Data Synchronization](#data-synchronization)
- [Search Functionality](#search-functionality)

## Database Schema

### Core Tables

#### Cards Table
The `cards` table is the primary table for storing Pokémon card information:

- `id`: text (Primary Key), NOT NULL
- `name`: text, NOT NULL
- `supertype`: text, nullable
- `types`: ARRAY, nullable
- `set_id`: text, NOT NULL, foreign key referencing "sets" table
- `language`: text, NOT NULL, default 'English'
- `created_at`: timestamp with time zone, default now()
- `updated_at`: timestamp with time zone, default now()
- `last_sync_at`: timestamp with time zone, default now()

#### Card Variations Table
The `card_variations` table stores information about different variations of a card:

- `id`: uuid (Primary Key), NOT NULL, default uuid_generate_v4()
- `card_id`: text, NOT NULL, foreign key referencing "cards" table
- `variation_type`: text, NOT NULL
- `treatment`: text, nullable
- `holofoil_pattern`: text, nullable
- `is_special_rarity`: boolean, default false
- `special_rarity_type`: text, nullable
- `image_url`: text, nullable
- `tcg_api_price_key`: text, nullable
- `created_at`: timestamp with time zone, default now()

### Other Tables
- `sets`: Stores information about card sets
- `rarity_types`: Stores information about different rarity types

### Database Relationships

```mermaid
erDiagram
    CARDS ||--o{ CARD_VARIATIONS : has
    SETS ||--o{ CARDS : contains
    RARITY_TYPES ||--o{ CARDS : categorizes
    
    CARDS {
        string id PK
        string name
        string supertype
        array types
        string set_id FK
        string language
        timestamp created_at
        timestamp updated_at
        timestamp last_sync_at
    }
    
    CARD_VARIATIONS {
        uuid id PK
        string card_id FK
        string variation_type
        string treatment
        string holofoil_pattern
        boolean is_special_rarity
        string special_rarity_type
        string image_url
        string tcg_api_price_key
        timestamp created_at
    }
    
    SETS {
        string id PK
        string name
        string series
        date release_date
        int total
        string logo_url
        string symbol_url
        timestamp created_at
        timestamp updated_at
        timestamp last_sync_at
    }
    
    RARITY_TYPES {
        uuid id PK
        string name
        string symbol
        string era
        string description
        timestamp created_at
    }
```

## Supabase Integration

### Client-Side Integration

The project uses two approaches for Supabase client initialization:

1. **Browser Client** (`src/lib/supabase-browser.ts` (planned)):
   ```typescript
   'use client';
   import { createClient } from '@supabase/supabase-js';
   import { Database } from './database.types';

   export const createBrowserSupabaseClient = () => {
     return createClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL || '',
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
     );
   };

   export default createBrowserSupabaseClient;
   ```

2. **SSR Client** (using `@supabase/ssr`):
   Used for server-side components and API routes in Next.js 15.

### Application Architecture with Supabase

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        CSR[Client-Side Rendering]
        SSR[Server-Side Rendering]
    end
    
    subgraph AppLogic["Application Logic"]
        Components[React Components]
        Hooks[Custom Hooks]
        Services[Service Functions]
        APIRoutes[API Routes]
    end
    
    subgraph Supabase["Supabase"]
        Auth[Authentication]
        RLS[Row Level Security]
        Database[(PostgreSQL)]
        Storage[File Storage]
        Functions[Edge Functions]
    end
    
    subgraph External["External Services"]
        PokemonAPI[Pokemon TCG API]
    end
    
    CSR --> Components
    SSR --> APIRoutes
    SSR --> Components
    
    Components --> Hooks
    Hooks --> Services
    APIRoutes --> Services
    
    Services -- "Browser Client" --> Auth
    Services -- "Browser Client" --> Database
    Services -- "Browser Client" --> Storage
    
    APIRoutes -- "Server Client" --> Auth
    APIRoutes -- "Server Client" --> Database
    APIRoutes -- "Server Client" --> Storage
    
    Services --> PokemonAPI
    
    RLS -.- Database
    
    style Client fill:#f9f9f9,stroke:#333
    style AppLogic fill:#e6f7ff,stroke:#0077b6
    style Supabase fill:#ebfaeb,stroke:#008000
    style External fill:#fff2e6,stroke:#ff8c00
```

### TypeScript Integration

The project uses TypeScript types generated from the Supabase schema, stored in `src/lib/database.types.ts` (planned), which provides type safety when interacting with the database.

## API System

### Test Endpoints

1. **Pokemon TCG Test Endpoint** (`src/app/api/test-pokemon-tcg/route.ts` (planned)):
   - Syncs set and card data from Pokemon TCG API to Supabase
   - Performs data transformations
   - Returns success status and statistics

2. **Supabase Test Endpoint** (`src/app/api/test-supabase/route.ts` (planned)):
   - Tests the Supabase connection
   - Queries the `rarity_types` table
   - Returns connection status

### API Request Flow

```mermaid
sequenceDiagram
    participant Client as Client Browser
    participant APIRoute as Next.js API Route
    participant Service as Service Layer
    participant SupabaseClient as Supabase Client
    participant Supabase as Supabase Backend
    participant PokemonAPI as Pokemon TCG API
    
    Client->>APIRoute: HTTP Request
    
    alt Direct Database Access
        Client->>SupabaseClient: Query Database
        SupabaseClient->>Supabase: Execute Query
        Supabase-->>SupabaseClient: Return Results
        SupabaseClient-->>Client: Format Results
    else API Route
        APIRoute->>Service: Process Request
        Service->>SupabaseClient: Query Database
        
        opt External API Call
            Service->>PokemonAPI: Request Data
            PokemonAPI-->>Service: Return Data
        end
        
        SupabaseClient->>Supabase: Execute Query
        Supabase-->>SupabaseClient: Return Results
        SupabaseClient-->>Service: Return Results
        Service-->>APIRoute: Process Results
        APIRoute-->>Client: HTTP Response
    end
```

### Data Access Pattern

The application primarily uses **client-side data fetching** directly from Supabase, rather than dedicated API endpoints for each data operation. This approach:

1. Leverages Supabase's Row Level Security (RLS) for access control
2. Reduces backend code by using Supabase's query capabilities directly
3. Enables real-time updates when the database changes

## Data Synchronization

### Pokemon TCG Service

The `PokemonTcgService` (`src/lib/services/pokemon-tcg-service.ts` (planned)) handles synchronization of data from the Pokemon TCG API to the Supabase database:

1. **Set Synchronization**: Fetches all sets from the Pokemon TCG API and upserts them into the Supabase database
2. **Card Synchronization**: Fetches cards for specific sets, transforms the data, and upserts them into the database
3. **Variation Handling**: Creates and updates card variations based on alternative art, holofoil patterns, etc.

### Synchronization Process Flow

```mermaid
flowchart TD
    Start([Start Sync]) --> FetchSets[Fetch Sets from Pokemon TCG API]
    FetchSets --> UpsertSets[Upsert Sets to Supabase]
    UpsertSets --> SetLoop{For Each Set}
    
    SetLoop --> FetchCards[Fetch Cards for Set]
    FetchCards --> TransformCards[Transform Card Data]
    TransformCards --> UpsertCards[Upsert Cards to Supabase]
    UpsertCards --> ProcessVariations[Process Card Variations]
    ProcessVariations --> UpsertVariations[Upsert Variations to Supabase]
    UpsertVariations --> SetLoop
    
    SetLoop --> |All Sets Processed| UpdateTimestamps[Update Sync Timestamps]
    UpdateTimestamps --> End([End Sync])
    
    style Start fill:#d4edda,stroke:#28a745
    style End fill:#d4edda,stroke:#28a745
    style FetchSets fill:#e6f7ff,stroke:#007bff
    style FetchCards fill:#e6f7ff,stroke:#007bff
    style UpsertSets fill:#ebfaeb,stroke:#28a745
    style UpsertCards fill:#ebfaeb,stroke:#28a745
    style UpsertVariations fill:#ebfaeb,stroke:#28a745
    style TransformCards fill:#fff3cd,stroke:#ffc107
    style ProcessVariations fill:#fff3cd,stroke:#ffc107
```

## Search Functionality

The advanced search functionality is implemented in the client-side component (`src/app/test-cards/advanced/page.tsx` (planned)) without a dedicated API endpoint:

1. **Filter Initialization**:
   - Fetches available sets, rarity types, and other filter options from Supabase
   - Extracts unique values for types, generations, and eras

2. **Dynamic Query Building**:
   - Constructs a Supabase query based on URL search parameters
   - Applies filters for set, rarity, type, generation, era, and name search
   - Orders and limits results

3. **UI Display**:
   - Renders filter form with dropdown options
   - Displays card grid with images and details
   - Links to card details and related functionality

### Search Parameters

The advanced search supports the following filters:
- Set (dropdown from sets table)
- Rarity (dropdown from rarity_types table)
- Type (dropdown from unique card types)
- Generation (dropdown from unique pokemon_generation values)
- Era (dropdown from unique card_era values)
- Name search (text input with ilike query)

## Future Enhancements

1. **Dedicated API Routes**: Consider creating dedicated API routes for complex operations to:
   - Centralize business logic
   - Add caching layers
   - Implement custom validation

2. **Real-time Subscriptions**: Leverage Supabase's real-time capabilities for live updates

3. **Improved Error Handling**: Standardize error handling across API routes and client-side code

## Environment Variables

The system requires the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side access
- `POKEMONTCG_API_KEY`: API key for accessing the Pokemon TCG API