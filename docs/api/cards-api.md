---
title: Cards Api
type: technical-document
description: Documentation for Cards Api
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-19'
status: draft
category: documentation
has_mermaid: true
---
---
title: "API Documentation: Cards API"
endpoint: "/api/admin/cards"
method: "GET"
version: "1.0"
auth_required: true
rate_limit: "100 requests/minute"
implementation: "src/app/api/admin/cards/route.ts"
last_updated: "2023-11-18"
---

# Cards API

<description>
The Cards API provides access to the Pokémon TCG card database with advanced filtering, sorting, and pagination capabilities. This endpoint is used by the admin card browser interface to display and manage card data.
</description>

## Request Schema

<request_schema>
```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "integer",
      "description": "Page number for pagination (1-indexed)",
      "default": 1
    },
    "pageSize": {
      "type": "integer",
      "description": "Number of items per page",
      "default": 20,
      "enum": [10, 20, 50, 100]
    },
    "filters": {
      "type": "object",
      "properties": {
        "set": {
          "type": "string",
          "description": "Filter by set ID"
        },
        "rarity": {
          "type": "string",
          "description": "Filter by card rarity"
        },
        "types": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Filter by card types"
        },
        "name": {
          "type": "string",
          "description": "Search by card name (partial match)"
        },
        "minPrice": {
          "type": "number",
          "description": "Minimum price in USD"
        },
        "maxPrice": {
          "type": "number",
          "description": "Maximum price in USD"
        }
      }
    },
    "sort": {
      "type": "object",
      "properties": {
        "field": {
          "type": "string",
          "description": "Field to sort by",
          "enum": ["name", "number", "set", "rarity", "price", "updatedAt"]
        },
        "direction": {
          "type": "string",
          "description": "Sort direction",
          "enum": ["asc", "desc"]
        }
      }
    }
  }
}
```
</request_schema>

## Response Schema

<response_schema>
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique card ID"
          },
          "name": {
            "type": "string",
            "description": "Card name"
          },
          "number": {
            "type": "string",
            "description": "Card number in set"
          },
          "set": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Set ID"
              },
              "name": {
                "type": "string",
                "description": "Set name"
              }
            }
          },
          "rarity": {
            "type": "string",
            "description": "Card rarity"
          },
          "images": {
            "type": "object",
            "properties": {
              "small": {
                "type": "string",
                "description": "URL to small card image"
              },
              "large": {
                "type": "string",
                "description": "URL to large card image"
              }
            }
          },
          "price": {
            "type": "object",
            "properties": {
              "low": {
                "type": "number",
                "description": "Lowest market price"
              },
              "mid": {
                "type": "number",
                "description": "Average market price"
              },
              "high": {
                "type": "number",
                "description": "Highest market price"
              },
              "updatedAt": {
                "type": "string",
                "format": "date-time",
                "description": "Price update timestamp"
              }
            }
          }
        }
      }
    },
    "pagination": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "description": "Current page number"
        },
        "pageSize": {
          "type": "integer",
          "description": "Number of items per page"
        },
        "totalItems": {
          "type": "integer",
          "description": "Total number of items matching the query"
        },
        "totalPages": {
          "type": "integer",
          "description": "Total number of pages"
        }
      }
    }
  }
}
```
</response_schema>

## Example Request

<example_request>
```javascript
fetch('/api/admin/cards', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  body: JSON.stringify({
    page: 1,
    pageSize: 20,
    filters: {
      set: "swsh12",
      rarity: "Rare Holo",
      types: ["Psychic", "Water"],
      minPrice: 5,
      maxPrice: 50
    },
    sort: {
      field: "price",
      direction: "desc"
    }
  })
});
```
</example_request>

## Example Response

<example_response>
```json
{
  "data": [
    {
      "id": "swsh12-25",
      "name": "Mew V",
      "number": "25",
      "set": {
        "id": "swsh12",
        "name": "Brilliant Stars"
      },
      "rarity": "Rare Holo",
      "images": {
        "small": "https://images.pokemontcg.io/swsh12/25.png",
        "large": "https://images.pokemontcg.io/swsh12/25_hires.png"
      },
      "price": {
        "low": 12.99,
        "mid": 18.50,
        "high": 25.00,
        "updatedAt": "2023-11-15T14:30:00Z"
      }
    },
    // Additional card objects...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 157,
    "totalPages": 8
  }
}
```
</example_response>

## Error Codes

<error_codes>
| Status Code | Error Code | Description | Resolution |
|-------------|------------|-------------|------------|
| 400 | INVALID_PARAMETERS | Invalid request parameters | Check request format |
| 401 | UNAUTHORIZED | Missing or invalid token | Provide valid token |
| 403 | FORBIDDEN | Insufficient permissions | Requires admin role |
| 429 | RATE_LIMITED | Too many requests | Reduce request frequency |
| 500 | SERVER_ERROR | Internal server error | Contact system administrator |
</error_codes>

## Implementation Details

<implementation_details>
The Cards API is implemented using Next.js API routes with the following components:

1. **Request Validation**:
   - Validates incoming parameters using Zod schema validation
   - Ensures proper pagination, filtering, and sorting parameters

2. **Database Query**:
   - Constructs a Supabase query based on the provided filters
   - Applies sorting and pagination
   - Optimizes query performance with proper indexes

3. **Response Formatting**:
   - Transforms database results into the standardized API response format
   - Includes pagination metadata
   - Ensures consistent property naming
</implementation_details>

## API Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/admin/cards
    participant Supabase
    participant PokemonTCG as Pokémon TCG API

    Client->>API: GET /api/admin/cards
    Note over API: Validate request parameters
    
    API->>Supabase: Query cards table with filters
    Supabase-->>API: Return matching cards
    
    alt Missing price data
        API->>PokemonTCG: Fetch latest prices
        PokemonTCG-->>API: Return price data
        API->>Supabase: Update price information
    end
    
    API->>Client: Return formatted response
``` 