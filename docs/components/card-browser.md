---
title: Card Browser
type: technical-document
description: Documentation for Card Browser
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-19'
status: draft
category: documentation
has_mermaid: true
---
---
title: "Component Documentation: CardBrowser"
component_name: "CardBrowser"
path: "src/components/cards/CardBrowser.tsx"
implements: ["CardSearchable", "CardFilterable", "CardSortable"]
dependencies:
  - "@radix-ui/react-select"
  - "@radix-ui/react-tabs"
  - "lucide-react"
  - "next/image"
version: "1.0.0"
last_updated: "2023-11-18"
---

# CardBrowser Component

<purpose>
The CardBrowser component provides a comprehensive interface for browsing, searching, filtering, and sorting Pokémon cards. It supports both grid and table views, pagination, advanced filtering options, and integrates with the card database to display real-time pricing information with freshness indicators.
</purpose>

## Props

<props>
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| initialFilters | CardFilters | No | `{}` | Initial filter state |
| initialSort | SortOptions | No | `{ field: 'name', direction: 'asc' }` | Initial sort state |
| initialView | 'grid' \| 'table' | No | 'grid' | Initial view mode |
| pageSize | number | No | 20 | Number of cards per page |
| showAnalytics | boolean | No | false | Whether to show set distribution analytics |
| adminMode | boolean | No | false | Whether to show admin controls |
| onCardSelect | (card: Card) => void | No | - | Callback when a card is selected |
</props>

## Usage Examples

<usage_example>
```tsx
// Basic usage
<CardBrowser />

// With initial filters and admin mode
<CardBrowser 
  initialFilters={{
    set: 'swsh12',
    rarity: 'Rare Holo',
    types: ['Psychic', 'Water'],
    minPrice: 5,
    maxPrice: 50
  }}
  initialSort={{ field: 'price', direction: 'desc' }}
  initialView="table"
  pageSize={50}
  showAnalytics={true}
  adminMode={true}
  onCardSelect={(card) => console.log('Selected card:', card)}
/>
```
</usage_example>

## Component Architecture

<implementation_details>
The CardBrowser component implements a modular architecture with the following sub-components:

1. **CardFilters**: Manages filter state and UI
   - Set selector with search
   - Rarity filter dropdown
   - Type multi-select
   - Price range slider
   - Generation and era filters
   - Search input with debounce

2. **CardGrid/CardTable**: Display components for different view modes
   - Grid displays cards in a responsive layout
   - Table provides a detailed view with sortable columns
   - Both implement virtualization for performance

3. **CardPagination**: Handles pagination logic
   - Page navigation
   - Items per page selector
   - Total items counter

4. **CardSetAnalytics**: Optional analytics panel
   - Set distribution visualization
   - Rarity breakdown
   - Price distribution chart

The component uses React Context to manage state across sub-components and implements custom hooks for filtering, sorting, and data fetching logic.
</implementation_details>

## State Management

<state_management>
The CardBrowser manages several pieces of state:

```typescript
// Filter state
const [filters, setFilters] = useState<CardFilters>(initialFilters);

// Sort state
const [sort, setSort] = useState<SortOptions>(initialSort);

// Pagination state
const [page, setPage] = useState<number>(1);
const [totalItems, setTotalItems] = useState<number>(0);

// View mode state
const [viewMode, setViewMode] = useState<'grid' | 'table'>(initialView);

// Loading state
const [loading, setLoading] = useState<boolean>(false);

// Cards data
const [cards, setCards] = useState<Card[]>([]);
```

State updates trigger data fetching with appropriate debouncing to prevent excessive API calls.
</state_management>

## Data Fetching Logic

<data_fetching>
The component fetches data from the Cards API:

```typescript
const fetchCards = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/admin/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page,
        pageSize,
        filters,
        sort,
      }),
    });
    
    const data = await response.json();
    setCards(data.data);
    setTotalItems(data.pagination.totalItems);
  } catch (error) {
    console.error('Error fetching cards:', error);
  } finally {
    setLoading(false);
  }
}, [page, pageSize, filters, sort]);

// Fetch cards on mount and when dependencies change
useEffect(() => {
  fetchCards();
}, [fetchCards]);
```

To optimize performance, the component implements:
1. Debounced search input
2. Memoized filter combinations
3. Pagination to limit data size
4. Image lazy loading
</data_fetching>

## Accessibility

<accessibility>
The CardBrowser component implements the following accessibility features:

- **Keyboard Navigation**:
  - Tab navigation between interactive elements
  - Arrow key navigation in grid view
  - Sort controls with keyboard support
  - Escape key to clear filters

- **Screen Reader Support**:
  - ARIA labels for all interactive elements
  - Appropriate heading structure
  - Status announcements for loading states
  - Image alt text for all card images

- **Visual Accessibility**:
  - High contrast mode support
  - Color-blind friendly indicators
  - Resizable text compatibility
  - Focus indicators for keyboard navigation

- **WCAG Compliance**:
  - Meets WCAG 2.1 AA standards
  - Proper color contrast ratios
  - Text alternatives for non-text content
  - Keyboard operability
</accessibility>

## Test Coverage

<test_coverage>
The CardBrowser component tests cover:

1. **Unit Tests** (`src/components/__tests__/CardBrowser.test.tsx` (planned)):
   - Rendering in different view modes
   - Filter functionality
   - Sort functionality
   - Pagination functionality
   - Analytics panel rendering

2. **Integration Tests** (`src/tests/integration/card-browser.test.ts` (planned)):
   - API integration
   - Filter and sort combinations
   - Response handling
   - Error states

3. **Snapshot Tests**:
   - Visual regression testing
   - Default state rendering
   - Various filter combinations

4. **Performance Tests**:
   - Rendering large datasets
   - Filter operation speed
   - Memory usage monitoring
</test_coverage>

## Component Flow Diagram

```mermaid
flowchart TD
    User([User]) -->|Interacts with| CB[CardBrowser]
    CB -->|Contains| Filters[CardFilters]
    CB -->|Contains| ViewToggle[ViewModeToggle]
    CB -->|Contains| Grid[CardGrid]
    CB -->|Contains| Table[CardTable]
    CB -->|Contains| Pagination[CardPagination]
    CB -->|Contains| Analytics[CardAnalytics]
    
    Filters -->|Updates| FilterState[Filter State]
    ViewToggle -->|Updates| ViewState[View State]
    Pagination -->|Updates| PageState[Page State]
    
    FilterState -->|Triggers| DataFetch[Data Fetching]
    ViewState -->|Affects| DisplayMode[Display Mode]
    PageState -->|Triggers| DataFetch
    
    DataFetch -->|Populates| CardData[Card Data]
    CardData -->|Renders in| Grid
    CardData -->|Renders in| Table
    CardData -->|Analyzed in| Analytics