---
title: System Design Document
type: technical-document
description: Documentation for System Design Document
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-24'
status: Active
tags:
  - documentation
has_mermaid: true
related_docs:
  - path: docs/inventory-management/data-model.md
  - path: docs/api-reference.md
  - path: docs/user-trading-flow.md
---

Thank you for the clarifications. I'll update the system design document to incorporate these details:

# Pokémon TCG Trade Platform - System Design Document (Updated)

## 1. Overview

This document outlines the database schema and data management strategy for the Pokémon TCG Trade Platform. The platform will allow users to create shareable profile catalogs of their trading cards with WhatsApp integration for direct communication. The focus is on creating robust user profiles with streamlined inventory management, not a global marketplace (which is reserved for future development).

## 2. Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Shadcn
- **Backend/Database**: Supabase
- **API Integration**: Pokémon TCG API (via Typescript SDK)
- **Authentication**: Supabase Auth with Phone/SMS verification using Twilio
- **Hosting**: Vercel (free tier initially)
- **Analytics**: Vercel Analytics (free tier)

### 2.1 System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        MobileWeb[Mobile Web]
    end
    
    subgraph Frontend["Frontend Layer (Vercel)"]
        NextJS[Next.js App]
        UI[UI Components]
        ClientAPI[Client-side API]
        Pages[App Pages]
    end
    
    subgraph Backend["Backend Layer (Supabase)"]
        Auth[Authentication]
        DB[(PostgreSQL Database)]
        Storage[File Storage]
        subgraph Edge["Edge Functions"]
            APIRoutes[API Routes]
            Webhooks[Webhooks]
        end
    end
    
    subgraph External["External Services"]
        PokemonAPI[Pokemon TCG API]
        Twilio[Twilio SMS]
        WhatsApp[WhatsApp Business API]
    end
    
    Browser --> NextJS
    MobileWeb --> NextJS
    NextJS --> UI
    NextJS --> ClientAPI
    NextJS --> Pages
    
    ClientAPI --> Auth
    ClientAPI --> APIRoutes
    Pages --> APIRoutes
    
    APIRoutes --> DB
    APIRoutes --> Storage
    APIRoutes --> PokemonAPI
    APIRoutes --> Twilio
    APIRoutes --> WhatsApp
    Webhooks --> PokemonAPI
    
    Auth --> DB
    
    style Client fill:#f9f9f9,stroke:#333
    style Frontend fill:#e6f7ff,stroke:#0077b6
    style Backend fill:#ebfaeb,stroke:#008000
    style External fill:#fff2e6,stroke:#ff8c00
    style Edge fill:#d1ffd1,stroke:#006400
```

## 3. Database Schema

### 3.1 Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  profile_slug TEXT UNIQUE NOT NULL,
  profile_image_url TEXT,
  bio TEXT,
  location TEXT,
  whatsapp_number TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE
);
```

#### `sets`
```sql
CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT, -- The major grouping (eg: "Scarlet & Violet", "Sword & Shield")
  release_date DATE,
  total INTEGER,
  logo_url TEXT,
  symbol_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `cards`
```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  supertype TEXT,
  types TEXT[],
  set_id TEXT NOT NULL REFERENCES sets(id),
  number TEXT NOT NULL,
  rarity TEXT,
  rarity_code TEXT, -- Common, Uncommon, Rare, etc.
  card_era TEXT, -- Base, E-Series, EX Series, Diamond & Pearl, etc.
  language TEXT NOT NULL DEFAULT 'English', -- Primary options: English, Spanish, Japanese
  image_small TEXT,
  image_large TEXT,
  pokemon_generation INTEGER, -- Which game generation the Pokémon first appeared in (1-9)
  tcg_price DECIMAL(10,2),
  price_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `card_variations`
```sql
CREATE TABLE card_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL, -- Basic variation types: 'Normal', 'Reverse Holo', 'Holo', etc.
  treatment TEXT, -- Additional treatment descriptors: 'Full Art', 'Alt Art', 'Rainbow Rare', etc.
  holofoil_pattern TEXT, -- 'Cosmos', 'Tinsel', 'Sheen', 'Water-Web', etc.
  is_special_rarity BOOLEAN DEFAULT FALSE,
  special_rarity_type TEXT, -- 'Secret Rare', 'Ultra Rare', 'Illustration Rare', etc.
  image_url TEXT,
  tcg_api_price_key TEXT, -- Maps to the API's price data key (normal, holofoil, reverseHolofoil, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(card_id, variation_type, treatment)
);
```

### 3.2 Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ COLLECTIONS : owns
    USERS ||--o{ INVENTORY : sells
    USERS ||--o{ WISHLISTS : wants
    CARDS ||--o{ COLLECTIONS : contains
    CARDS ||--o{ INVENTORY : listed_in
    CARDS ||--o{ WISHLISTS : wanted_in
    CARDS }|--|| SETS : belongs_to
    CARDS ||--o{ CARD_VARIATIONS : has
    DELIVERY_STORES ||--o{ INVENTORY : pickup_from
    DELIVERY_STORES ||--o{ STORE_CONNECTIONS : connects_to
    
    USERS {
        uuid id PK
        string username
        string profile_slug
        string email
        string whatsapp_number
        string phone_number
        bool phone_verified
        bool is_admin
    }
    
    CARDS {
        string id PK
        string name
        string set_id FK
        string supertype
        string[] types
        string number
        string rarity
        float tcg_price
    }
    
    SETS {
        string id PK
        string name
        string series
        date release_date
        int total
    }
    
    CARD_VARIATIONS {
        uuid id PK
        string card_id FK
        string variation_type
        string treatment
        string holofoil_pattern
        bool is_special_rarity
    }
    
    COLLECTIONS {
        uuid id PK
        uuid user_id FK
        string card_id FK
        uuid variation_id FK
        string condition
        int quantity
    }
    
    INVENTORY {
        uuid id PK
        uuid user_id FK
        string card_id FK
        uuid variation_id FK
        string condition
        int quantity
        float price
        bool is_tradeable
        uuid delivery_from_id FK
    }
    
    WISHLISTS {
        uuid id PK
        uuid user_id FK
        string card_id FK
        uuid variation_id FK
        string[] condition_preference
        float max_price
    }
    
    DELIVERY_STORES {
        uuid id PK
        string name
        string location
        string network
    }
    
    STORE_CONNECTIONS {
        uuid id PK
        uuid from_store_id FK
        uuid to_store_id FK
    }
    
    CONTACT_LOGS {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        uuid inventory_id FK
    }
```

#### `rarity_types`
```sql
CREATE TABLE rarity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  symbol TEXT, -- Text representation of the symbol (●, ◆, ★, etc.)
  era TEXT, -- When this rarity was introduced/used
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `delivery_stores`
```sql
CREATE TABLE delivery_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  network TEXT NOT NULL, -- Identifies which network the store belongs to (e.g., "Omega")
  address TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `store_connections`
```sql
CREATE TABLE store_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_store_id UUID NOT NULL REFERENCES delivery_stores(id) ON DELETE CASCADE,
  to_store_id UUID NOT NULL REFERENCES delivery_stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_store_id, to_store_id)
);
```

#### `inventory` (User's Cards for Sale/Trade)
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES card_variations(id),
  condition TEXT NOT NULL CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'DMG')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  is_tradeable BOOLEAN DEFAULT FALSE,
  desired_trades TEXT, -- Text description of cards they would accept in trade
  delivery_from_id UUID REFERENCES delivery_stores(id),
  is_visible BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, card_id, variation_id, condition)
);
```

#### `collections` (User's Personal Collection)
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES card_variations(id),
  condition TEXT NOT NULL CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'DMG')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, card_id, variation_id, condition)
);
```

#### `wishlists`
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES card_variations(id),
  condition_preference TEXT[] DEFAULT ARRAY['NM'],
  max_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, card_id, variation_id)
);
```

#### `contact_logs` (Optional - for tracking inquiries)
```sql
CREATE TABLE contact_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.3 Views

```sql
-- Enhanced cards view combining card info with set info
CREATE VIEW enhanced_cards AS
SELECT 
  c.*,
  s.name as set_name,
  s.series as set_series,
  s.release_date,
  s.logo_url as set_logo_url,
  s.symbol_url as set_symbol_url
FROM cards c
JOIN sets s ON c.set_id = s.id;

-- User catalog view for profile pages
CREATE VIEW user_catalogs AS
SELECT 
  u.id as user_id,
  u.username,
  u.profile_slug,
  COUNT(DISTINCT i.card_id) as unique_cards,
  SUM(i.quantity) as total_cards,
  COUNT(DISTINCT c.set_id) as unique_sets
FROM users u
LEFT JOIN inventory i ON u.id = i.user_id
LEFT JOIN cards c ON i.card_id = c.id
WHERE i.is_visible = TRUE
GROUP BY u.id, u.username, u.profile_slug;

-- Store delivery options view
CREATE VIEW store_delivery_options AS
SELECT 
  s1.id as from_store_id,
  s1.name as from_store_name,
  s1.location as from_location,
  s2.id as to_store_id,
  s2.name as to_store_name,
  s2.location as to_location
FROM delivery_stores s1
JOIN store_connections sc ON s1.id = sc.from_store_id
JOIN delivery_stores s2 ON sc.to_store_id = s2.id;
```

## 4. Data Flow Processes

### 4.1 Card Synchronization Process

```mermaid
sequenceDiagram
    participant App as NextJS App
    participant SyncJob as Sync Job
    participant API as Pokemon TCG API
    participant DB as Supabase DB
    
    Note over SyncJob: Runs on schedule (daily/weekly)
    SyncJob->>API: Request latest sets
    API-->>SyncJob: Return sets data
    SyncJob->>DB: Update/Insert sets
    
    loop For each set
        SyncJob->>API: Request cards (paginated)
        API-->>SyncJob: Return cards data
        SyncJob->>DB: Upsert cards
        SyncJob->>DB: Upsert card variations
    end
    
    SyncJob->>DB: Update last_sync timestamps
    
    Note over App: User Views Card
    App->>DB: Request card details
    DB-->>App: Return card + pricing data
    App->>API: If pricing older than 24h, request update
    API-->>App: Return current pricing
    App->>DB: Update price data
```

## 5. Key Components Diagram

```mermaid
flowchart TD
    subgraph Users["User Experience"]
        Profile[User Profile]
        CardBrowser[Card Browser]
        Inventory[Inventory Management]
        Collection[Collection Management]
        Wishlist[Wishlist]
        Trading[Trading System]
    end
    
    subgraph Core["Core System"]
        Auth[Authentication]
        WhatsApp[WhatsApp Integration]
        Delivery[Delivery System]
        CardSync[Card Synchronization]
        Search[Search Engine]
    end
    
    subgraph Admin["Administration"]
        Dashboard[Admin Dashboard]
        Monitor[System Monitoring]
        CardMgmt[Card Management]
        UserMgmt[User Management]
    end
    
    Profile --> Auth
    CardBrowser --> Search
    CardBrowser --> CardSync
    Inventory --> CardSync
    Collection --> CardSync
    Trading --> WhatsApp
    Trading --> Delivery
    
    Dashboard --> Monitor
    Dashboard --> CardMgmt
    Dashboard --> UserMgmt
    
    style Users fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style Core fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style Admin fill:#fff8e1,stroke:#ffa000,stroke-width:2px
```

## Related Documentation

<related_docs>
- [Inventory Data Model](./inventory-management/data-model.md): Database schema and relationships
- [API Reference](./api-reference.md): API endpoints and integration details
- [User Trading Flow](./user-trading-flow.md): User interaction flows
</related_docs>