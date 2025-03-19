# Pokemon TCG Trading Platform Database Documentation

## Overview

This document provides a comprehensive overview of the database for the Pokemon TCG Trading Platform. The database uses PostgreSQL via Supabase and consists of multiple schemas, with the primary application data stored in the `public` schema.

## Database Schemas

| Schema Name         | Size     | Tables |
|---------------------|----------|--------|
| public              | 26 MB    | 12     |
| auth                | 664 kB   | 16     |
| storage             | 144 kB   | 5      |
| realtime            | 56 kB    | 3      |
| supabase_migrations | 64 kB    | 1      |
| vault               | 24 kB    | 1      |
| extensions          | 0 bytes  | 0      |
| graphql             | 0 bytes  | 0      |
| graphql_public      | 0 bytes  | 0      |

## Table Structure

### Core Tables

#### cards
*Stores information about Pokemon TCG cards*

| Column Name        | Data Type               | Nullable | Description                                   |
|--------------------|-------------------------|----------|-----------------------------------------------|
| id                 | text                    | NO       | Primary Key                                   |
| name               | text                    | NO       | Card name                                     |
| supertype          | text                    | YES      | Card supertype (e.g. Pokémon, Trainer, Energy)|
| types              | ARRAY                   | YES      | Array of card types                           |
| set_id             | text                    | NO       | Foreign key to sets.id                        |
| number             | text                    | NO       | Card number within the set                    |
| rarity             | text                    | YES      | Card rarity                                   |
| rarity_code        | text                    | YES      | Code representing the rarity                  |
| card_era           | text                    | YES      | The card's era (e.g. SWSH, SV)               |
| language           | text                    | NO       | Card language, defaults to 'English'          |
| image_small        | text                    | YES      | URL to small card image                       |
| image_large        | text                    | YES      | URL to large card image                       |
| pokemon_generation | integer                 | YES      | Pokémon generation number                     |
| tcg_price          | numeric                 | YES      | Current market price                          |
| price_updated_at   | timestamp with time zone| YES      | When the price was last updated               |
| created_at         | timestamp with time zone| YES      | Record creation timestamp                     |
| updated_at         | timestamp with time zone| YES      | Record update timestamp                       |
| last_sync_at       | timestamp with time zone| YES      | Last external sync timestamp                  |

**Rows:** 18,509

#### card_variations
*Stores variations of cards (holofoil, reverse holofoil, etc.)*

| Column Name         | Data Type               | Nullable | Description                               |
|---------------------|-------------------------|----------|-------------------------------------------|
| id                  | uuid                    | NO       | Primary Key                               |
| card_id             | text                    | NO       | Foreign key to cards.id                   |
| variation_type      | text                    | NO       | Type of variation                         |
| treatment           | text                    | YES      | Card treatment type                       |
| holofoil_pattern    | text                    | YES      | Specific holofoil pattern                 |
| is_special_rarity   | boolean                 | YES      | Indicates if it's a special rarity        |
| special_rarity_type | text                    | YES      | Type of special rarity                    |
| image_url           | text                    | YES      | URL to variation image                    |
| tcg_api_price_key   | text                    | YES      | Key for fetching price from external API  |
| created_at          | timestamp with time zone| YES      | Record creation timestamp                 |

**Rows:** 71,234

#### sets
*Stores information about Pokemon TCG sets*

| Column Name   | Data Type               | Nullable | Description                    |
|---------------|-------------------------|----------|--------------------------------|
| id            | text                    | NO       | Primary Key                    |
| name          | text                    | NO       | Set name                       |
| series        | text                    | YES      | Series name                    |
| release_date  | date                    | YES      | Set release date               |
| total         | integer                 | YES      | Total cards in set             |
| logo_url      | text                    | YES      | URL to set logo                |
| symbol_url    | text                    | YES      | URL to set symbol              |
| created_at    | timestamp with time zone| YES      | Record creation timestamp      |
| updated_at    | timestamp with time zone| YES      | Record update timestamp        |
| last_sync_at  | timestamp with time zone| YES      | Last external sync timestamp   |

**Rows:** 164

### User Data Tables

#### users
*Stores user account information*

| Column Name      | Data Type               | Nullable | Description                         |
|------------------|-------------------------|----------|-------------------------------------|
| id               | uuid                    | NO       | Primary Key                         |
| email            | text                    | YES      | User email                          |
| username         | text                    | NO       | Username                            |
| profile_slug     | text                    | NO       | URL-friendly profile identifier     |
| profile_image_url| text                    | YES      | URL to profile image                |
| bio              | text                    | YES      | User biography                      |
| location         | text                    | YES      | User location                       |
| whatsapp_number  | text                    | NO       | WhatsApp contact number             |
| phone_number     | text                    | YES      | Alternative phone number            |
| phone_verified   | boolean                 | YES      | Phone verification status           |
| created_at       | timestamp with time zone| YES      | Account creation timestamp          |
| updated_at       | timestamp with time zone| YES      | Account update timestamp            |
| is_verified      | boolean                 | YES      | Account verification status         |
| last_login       | timestamp with time zone| YES      | Last login timestamp                |
| is_admin         | boolean                 | YES      | Administrative privileges flag      |

**Rows:** 0

#### collections
*Tracks cards in a user's collection*

| Column Name  | Data Type               | Nullable | Description                        |
|--------------|-------------------------|----------|------------------------------------|
| id           | uuid                    | NO       | Primary Key                        |
| user_id      | uuid                    | NO       | Foreign key to users.id            |
| card_id      | text                    | NO       | Foreign key to cards.id            |
| variation_id | uuid                    | YES      | Foreign key to card_variations.id  |
| condition    | text                    | NO       | Card condition                     |
| quantity     | integer                 | NO       | Number of copies                   |
| notes        | text                    | YES      | User notes about the card          |
| created_at   | timestamp with time zone| YES      | Record creation timestamp          |
| updated_at   | timestamp with time zone| YES      | Record update timestamp            |

**Rows:** 0

#### inventory
*Tracks cards for trading/selling*

| Column Name      | Data Type               | Nullable | Description                          |
|------------------|-------------------------|----------|--------------------------------------|
| id               | uuid                    | NO       | Primary Key                          |
| user_id          | uuid                    | NO       | Foreign key to users.id              |
| card_id          | text                    | NO       | Foreign key to cards.id              |
| variation_id     | uuid                    | YES      | Foreign key to card_variations.id    |
| condition        | text                    | NO       | Card condition                       |
| quantity         | integer                 | NO       | Number of copies                     |
| price            | numeric                 | NO       | Asking price                         |
| is_tradeable     | boolean                 | YES      | Available for trade flag             |
| desired_trades   | text                    | YES      | Description of desired trades        |
| delivery_from_id | uuid                    | YES      | Foreign key to delivery_stores.id    |
| is_visible       | boolean                 | YES      | Visibility flag, defaults to true    |
| notes            | text                    | YES      | Seller notes                         |
| created_at       | timestamp with time zone| YES      | Record creation timestamp            |
| updated_at       | timestamp with time zone| YES      | Record update timestamp              |

**Rows:** 0

#### wishlists
*Tracks cards users want to acquire*

| Column Name         | Data Type               | Nullable | Description                          |
|---------------------|-------------------------|----------|--------------------------------------|
| id                  | uuid                    | NO       | Primary Key                          |
| user_id             | uuid                    | NO       | Foreign key to users.id              |
| card_id             | text                    | NO       | Foreign key to cards.id              |
| variation_id        | uuid                    | YES      | Foreign key to card_variations.id    |
| condition_preference| ARRAY                   | YES      | Preferred conditions, default ['NM'] |
| max_price           | numeric                 | YES      | Maximum price willing to pay         |
| created_at          | timestamp with time zone| YES      | Record creation timestamp            |
| updated_at          | timestamp with time zone| YES      | Record update timestamp              |

**Rows:** 0

### Delivery System Tables

#### delivery_stores
*Stores information about physical delivery locations*

| Column Name  | Data Type               | Nullable | Description                    |
|--------------|-------------------------|----------|--------------------------------|
| id           | uuid                    | NO       | Primary Key                    |
| name         | text                    | NO       | Store name                     |
| location     | text                    | NO       | Store location/area            |
| network      | text                    | NO       | Store network/brand            |
| address      | text                    | YES      | Store address                  |
| contact_info | text                    | YES      | Contact information            |
| created_at   | timestamp with time zone| YES      | Record creation timestamp      |

**Rows:** 0

#### store_connections
*Maps store-to-store delivery connections*

| Column Name   | Data Type               | Nullable | Description                        |
|---------------|-------------------------|----------|------------------------------------|
| id            | uuid                    | NO       | Primary Key                        |
| from_store_id | uuid                    | NO       | Foreign key to delivery_stores.id  |
| to_store_id   | uuid                    | NO       | Foreign key to delivery_stores.id  |
| created_at    | timestamp with time zone| YES      | Record creation timestamp          |

**Rows:** 0

### Reference Tables

#### rarity_types
*Reference table for card rarity types*

| Column Name | Data Type               | Nullable | Description                    |
|-------------|-------------------------|----------|--------------------------------|
| id          | uuid                    | NO       | Primary Key                    |
| name        | text                    | NO       | Rarity name                    |
| symbol      | text                    | YES      | Symbol representing the rarity |
| era         | text                    | YES      | Era when rarity was used       |
| description | text                    | YES      | Rarity description             |
| created_at  | timestamp with time zone| YES      | Record creation timestamp      |

**Rows:** 11

#### holofoil_patterns
*Reference table for different holofoil patterns*

| Column Name | Data Type               | Nullable | Description                    |
|-------------|-------------------------|----------|--------------------------------|
| id          | uuid                    | NO       | Primary Key                    |
| name        | text                    | NO       | Pattern name                   |
| era         | text                    | YES      | Era when pattern was used      |
| description | text                    | YES      | Pattern description            |
| created_at  | timestamp with time zone| YES      | Record creation timestamp      |

**Rows:** 6

#### contact_logs
*Logs for contact/communication between users*

| Column Name | Data Type               | Nullable | Description                    |
|-------------|-------------------------|----------|--------------------------------|
| id          | uuid                    | NO       | Primary Key                    |
| contact_type| text                    | NO       | Type of contact                |
| initiated_by| uuid                    | NO       | User who initiated contact     |
| initiated_to| uuid                    | NO       | User who received contact      |
| created_at  | timestamp with time zone| YES      | Record creation timestamp      |

**Rows:** 0

### Views

#### enhanced_cards
*View that joins cards with their sets for easier querying*

Contains all columns from `cards` plus:
- set_name
- set_series
- release_date
- set_logo_url
- set_symbol_url

#### user_catalogs
*Aggregation view showing user collection statistics*

| Column Name  | Data Type | Description                          |
|--------------|-----------|--------------------------------------|
| user_id      | uuid      | User identifier                      |
| username     | text      | Username                             |
| profile_slug | text      | URL-friendly profile identifier      |
| unique_cards | bigint    | Count of unique cards in collection  |
| total_cards  | bigint    | Total cards (including duplicates)   |
| unique_sets  | bigint    | Count of unique sets in collection   |

#### store_delivery_options
*View showing all possible delivery connections between stores*

| Column Name     | Data Type | Description                           |
|-----------------|-----------|---------------------------------------|
| from_store_id   | uuid      | Source store ID                       |
| from_store_name | text      | Source store name                     |
| from_location   | text      | Source store location                 |
| to_store_id     | uuid      | Destination store ID                  |
| to_store_name   | text      | Destination store name                |
| to_location     | text      | Destination store location            |

## Relationships

### Primary Relationships:

1. **Cards and Sets**:
   - Each card belongs to one set (`cards.set_id` → `sets.id`)

2. **Cards and Variations**:
   - Each variation belongs to one card (`card_variations.card_id` → `cards.id`)

3. **Users and Collections/Inventory/Wishlists**:
   - Users own collections, inventory items, and wishlist entries
   - `collections.user_id` → `users.id`
   - `inventory.user_id` → `users.id`
   - `wishlists.user_id` → `users.id`

4. **Card Relationships in User Tables**:
   - Collections, inventory, and wishlists reference cards and variations
   - `collections.card_id` → `cards.id`
   - `collections.variation_id` → `card_variations.id`
   - `inventory.card_id` → `cards.id`
   - `inventory.variation_id` → `card_variations.id`
   - `wishlists.card_id` → `cards.id`
   - `wishlists.variation_id` → `card_variations.id`

5. **Delivery System**:
   - Inventory items can have a delivery store (`inventory.delivery_from_id` → `delivery_stores.id`)
   - Store connections link delivery stores (`store_connections.from_store_id` → `delivery_stores.id`)
   - Store connections link delivery stores (`store_connections.to_store_id` → `delivery_stores.id`)

## Data Volumes

| Table Name        | Row Count | Description                                    |
|-------------------|-----------|------------------------------------------------|
| card_variations   | 71,234    | Individual card variations across all cards    |
| cards             | 18,509    | Base card entries across all sets              |
| sets              | 164       | Pokemon TCG sets                               |
| rarity_types      | 11        | Card rarity types                              |
| holofoil_patterns | 6         | Holofoil pattern types                         |

## Current Database Status

The database structure is fully set up with card data imported (cards, sets, variations). 
The platform is ready for user accounts, collections, and trading functionality, but user data has not yet been populated. 