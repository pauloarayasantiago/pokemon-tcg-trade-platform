---
title: Mermaid Diagram Guide
type: technical-document
description: Documentation for Mermaid Diagram Guide
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-19'
status: draft
category: documentation
has_mermaid: true
---
---
title: "Mermaid Diagram Guide"
type: "guide"
description: "Standards and examples for creating effective mermaid diagrams in project documentation"
author: "Documentation Team"
version: "1.0.0"
last_updated: "2023-12-12"
status: "published"
category: "documentation"
has_mermaid: true
---

# Mermaid Diagram Guide

## Overview

This guide provides standards, templates, and best practices for creating effective mermaid diagrams in the Pokémon TCG Trading Platform documentation. Mermaid diagrams enhance comprehension of complex systems, workflows, and relationships, making documentation more accessible to both human readers and AI systems.

## Why Use Mermaid Diagrams?

- **Visual Clarity**: Convert complex text explanations into intuitive visual representations
- **Consistency**: Maintain a unified visual language across documentation
- **Maintainability**: Update diagrams easily within markdown files without external tools
- **AI Comprehension**: Provide structured representations that AI can parse and understand
- **Documentation Validation**: Meet our documentation standards (currently only 41% of docs have diagrams)

## Basic Diagram Types

### Flowcharts

Perfect for representing processes, workflows, and decision trees.

```mermaid
flowchart TD
    A[Start] --> B{Decision Point}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
    
    style A fill:#d4f1f9,stroke:#0077b6
    style E fill:#d4f1f9,stroke:#0077b6
    style B fill:#ffe8d6,stroke:#bc6c25
```

**Template:**
```
flowchart TD
    A[Start] --> B{Decision Point}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
    
    style A fill:#d4f1f9,stroke:#0077b6
    style E fill:#d4f1f9,stroke:#0077b6
    style B fill:#ffe8d6,stroke:#bc6c25
```

### Sequence Diagrams

Ideal for illustrating interactions between components or systems over time.

```mermaid
sequenceDiagram
    actor User
    participant UI as User Interface
    participant API as API Service
    participant DB as Database
    
    User->>UI: Search for card
    UI->>API: GET /api/cards?name=charizard
    API->>DB: Query cards
    DB-->>API: Return results
    API-->>UI: Return JSON response
    UI-->>User: Display results
```

**Template:**
```
sequenceDiagram
    actor User
    participant A as Component A
    participant B as Component B
    participant C as Component C
    
    User->>A: Action
    A->>B: Request
    B->>C: Process
    C-->>B: Response
    B-->>A: Result
    A-->>User: Display
```

### Class Diagrams

Useful for representing data models and class relationships.

```mermaid
classDiagram
    class Card {
        +String id
        +String name
        +String set
        +Float price
        +getDetails()
        +updatePrice()
    }
    
    class Collection {
        +String userId
        +Card[] cards
        +addCard()
        +removeCard()
    }
    
    class User {
        +String id
        +String name
        +Collection collection
        +getProfile()
    }
    
    User "1" -- "1" Collection
    Collection "1" -- "many" Card
```

**Template:**
```
classDiagram
    class Entity1 {
        +String property1
        +Type property2
        +method1()
        +method2()
    }
    
    class Entity2 {
        +String property1
        +Type property2
        +method1()
    }
    
    Entity1 "1" -- "many" Entity2
```

### Entity Relationship Diagrams

Perfect for database schema visualization.

```mermaid
erDiagram
    USERS ||--o{ COLLECTIONS : has
    COLLECTIONS ||--o{ CARDS : contains
    USERS ||--o{ WISHLIST : has
    CARDS ||--o{ WISHLIST : listed_in
    CARDS }|--|| SETS : belongs_to
    
    USERS {
        string id PK
        string name
        string email
        date created_at
    }
    
    COLLECTIONS {
        string id PK
        string user_id FK
        string name
        date created_at
    }
    
    CARDS {
        string id PK
        string name
        string set_id FK
        float price
    }
    
    SETS {
        string id PK
        string name
        date release_date
    }
    
    WISHLIST {
        string id PK
        string user_id FK
        string card_id FK
    }
```

**Template:**
```
erDiagram
    ENTITY1 ||--o{ ENTITY2 : relationship
    ENTITY2 ||--o{ ENTITY3 : relationship
    
    ENTITY1 {
        type field1 PK
        type field2
    }
    
    ENTITY2 {
        type field1 PK
        type field2 FK
    }
    
    ENTITY3 {
        type field1 PK
        type field2
    }
```

### State Diagrams

Ideal for illustrating state machines and transitions.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Searching: User inputs search term
    Searching --> Results: API returns data
    Searching --> Error: API error
    Results --> CardDetails: User selects card
    CardDetails --> Idle: User returns to search
    Error --> Idle: User retries
```

**Template:**
```
stateDiagram-v2
    [*] --> InitialState
    InitialState --> State2: Event1
    State2 --> State3: Event2
    State3 --> InitialState: Event3
    State3 --> [*]: Complete
```

### Gantt Charts

Useful for project planning and timeline visualization.

```mermaid
gantt
    title Card Synchronization Process
    dateFormat  YYYY-MM-DD
    
    section Planning
    Requirements Analysis   :a1, 2023-01-01, 10d
    System Design           :a2, after a1, 15d
    
    section Development
    API Integration         :b1, after a2, 10d
    Database Setup          :b2, after a2, 5d
    User Interface          :b3, after b1, 15d
    
    section Testing
    Unit Testing            :c1, after b3, 5d
    Integration Testing     :c2, after c1, 7d
    User Acceptance         :c3, after c2, 10d
```

**Template:**
```
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    
    section Phase 1
    Task 1   :a1, 2023-01-01, 10d
    Task 2   :a2, after a1, 15d
    
    section Phase 2
    Task 3   :b1, after a2, 10d
    Task 4   :b2, after b1, 7d
```

### Pie Charts

Good for showing distribution and proportions.

```mermaid
pie
    title Card Distribution by Type
    "Fire" : 42
    "Water" : 39
    "Grass" : 38
    "Electric" : 31
    "Psychic" : 28
    "Fighting" : 25
    "Other" : 67
```

**Template:**
```
pie
    title Distribution Title
    "Segment 1" : 40
    "Segment 2" : 30
    "Segment 3" : 20
    "Segment 4" : 10
```

## AI-Friendly Diagram Practices

### Semantic Labeling

- Use descriptive labels for nodes and edges
- Include clear titles for all diagrams
- Add captions explaining key aspects of the diagram

### Visual Hierarchy

- Use consistent styling for similar elements
- Apply color coding to indicate categories or importance
- Group related elements visually

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        UI[User Interface]
        Components[React Components]
        Hooks[Custom Hooks]
    end
    
    subgraph Backend["Backend Layer"]
        API[API Routes]
        Services[Services]
        DB[Database Access]
    end
    
    UI --> Components
    Components --> Hooks
    Hooks --> API
    API --> Services
    Services --> DB
    
    style Frontend fill:#e6f7ff,stroke:#0066cc
    style Backend fill:#fff2e6,stroke:#ff6600
```

### Text Descriptions

Always include a text description of what the diagram represents:

```
This flowchart illustrates the architecture of the Pokémon TCG Trading Platform, 
showing the relationship between frontend components (User Interface, React Components, 
Custom Hooks) and backend services (API Routes, Services, Database Access).
```

## Diagram Integration Examples

### API Documentation

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/cards
    participant Service as CardService
    participant DB as Database
    
    Client->>API: GET /api/cards?set=base
    API->>Service: getCardsBySet("base")
    Service->>DB: query("SET = base")
    DB-->>Service: Card[] results
    Service-->>API: formatted results
    API-->>Client: JSON response
```

### Component Documentation

```mermaid
flowchart LR
    subgraph Parent["CardBrowser Component"]
        Search[SearchBar]
        Filters[FilterPanel]
        Results[ResultsGrid]
        Pagination[PaginationControls]
    end
    
    Search --> Results
    Filters --> Results
    Results --> Pagination
    Pagination --> Results
    
    style Parent fill:#f0f0f0,stroke:#333333
    style Search fill:#e1f5fe,stroke:#01579b
    style Filters fill:#e8f5e9,stroke:#2e7d32
    style Results fill:#fff3e0,stroke:#ff6f00
    style Pagination fill:#f3e5f5,stroke:#7b1fa2
```

### Process Documentation

```mermaid
stateDiagram-v2
    [*] --> Init
    Init --> FetchingData: startSync()
    FetchingData --> ProcessingCards: data received
    FetchingData --> ErrorState: network error
    ProcessingCards --> ValidatingData: processing complete
    ValidatingData --> StoringData: validation passed
    ValidatingData --> ErrorState: validation failed
    StoringData --> Complete: data stored
    StoringData --> ErrorState: storage error
    ErrorState --> Init: retry()
    Complete --> [*]
```

## Tools for Creating Mermaid Diagrams

- **Mermaid Live Editor**: [https://mermaid.live/](https://mermaid.live/)
- **VS Code Mermaid Preview Extension**: View diagrams directly in your editor
- **Mermaid CLI**: Generate SVG files from mermaid diagrams
- **Our Custom Mermaid Template Generator**: See tools/mermaid-generator.js

## Adding Diagrams to Documentation

1. **Identify visualization opportunities**: Look for complex processes, architectures, or relationships
2. **Select the appropriate diagram type** based on what you're explaining
3. **Create the diagram** using the templates provided above
4. **Add the diagram to your markdown file** using the mermaid code block syntax:

```
```mermaid
diagram code here
```
```

5. **Include a text description** of what the diagram represents
6. **Set `has_mermaid: true`** in your document's frontmatter
7. **Validate your documentation** with `npm run validate-docs`

## Diagram Checklist

Before adding a diagram to documentation, ensure it meets these criteria:

- [ ] Uses the appropriate diagram type for the content
- [ ] Includes descriptive labels for all elements
- [ ] Has a clear title and purpose
- [ ] Uses consistent styling with other diagrams
- [ ] Includes accompanying text description
- [ ] Does not contain excessive detail that could confuse users
- [ ] Follows our color scheme and styling conventions
- [ ] Fits well within the documentation flow

## Conclusion

Incorporating effective mermaid diagrams into our documentation significantly improves both human and AI comprehension of our system. By following these guidelines and using the provided templates, we can ensure consistent, high-quality visualizations throughout our documentation.

For technical assistance with creating diagrams, refer to the official [Mermaid Documentation](https://mermaid.js.org/intro/) or contact the Documentation Team. 