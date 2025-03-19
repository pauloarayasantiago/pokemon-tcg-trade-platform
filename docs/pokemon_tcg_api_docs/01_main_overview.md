---
title: 01 Main Overview
type: technical-document
description: Documentation for 01 Main Overview
author: Documentation Team
version: 1.0.0
last_updated: '2025-03-19'
status: draft
category: documentation
has_mermaid: true
---
---
title: Main Overview
version: 1.0.0
last_updated: '2025-03-24'
status: Active
tags:
  - documentation
has_mermaid: true
---

# Pokémon TCG API Documentation

## Main Page - Welcome

Welcome to the Pokémon TCG API docs!

## API Architecture

```mermaid
flowchart TD
    Client[Client Application] --> Auth[Authentication]
    Auth --> Endpoints[API Endpoints]
    
    Endpoints --> Cards[Cards Endpoints]
    Endpoints --> Sets[Sets Endpoints]
    Endpoints --> Metadata[Metadata Endpoints]
    
    subgraph CardOps["Card Operations"]
        Cards --> GetAllCards[Get All Cards]
        Cards --> GetCardById[Get Card by ID]
        Cards --> SearchCards[Search Cards]
    end
    
    subgraph SetOps["Set Operations"]
        Sets --> GetAllSets[Get All Sets]
        Sets --> GetSetById[Get Set by ID]
        Sets --> SearchSets[Search Sets]
    end
    
    subgraph MetaOps["Metadata Operations"]
        Metadata --> Types[Get Types]
        Metadata --> Subtypes[Get Subtypes]
        Metadata --> Supertypes[Get Supertypes]
        Metadata --> Rarities[Get Rarities]
    end
    
    Cards -.-> Card[Card Object]
    Sets -.-> Set[Set Object]
    
    Card --> CardAttributes[Card Attributes]
    Set --> SetAttributes[Set Attributes]
    
    style Client fill:#f5f5f5,stroke:#333,stroke-width:2px
    style Auth fill:#e3f2fd,stroke:#0d47a1,stroke-width:1px
    style Endpoints fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px
    style Cards fill:#fff3e0,stroke:#e65100,stroke-width:1px
    style Sets fill:#e8eaf6,stroke:#1a237e,stroke-width:1px
    style Metadata fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
    style Card fill:#e0f7fa,stroke:#006064,stroke-width:1px
    style Set fill:#e0f2f1,stroke:#004d40,stroke-width:1px
```

### Overview

The Pokémon TCG API is organized around REST. Our API has predictable resource-oriented URLs, accepts JSON encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

You can use the Pokémon TCG API without registering for an API key, although your limits are far less than if you had an API key. The API key you use to authenticate the request determines your rate limits. Register for an api key at the Developer Portal.

You can use this documentation to get familiar with the REST API or any of the supported developer SDKs, such as Python, Ruby and more.

### Version 1 Deprecation

Version 1 of the API will no longer receive any data updates. It is officially deprecated as of August 1, 2021. The last set available in Version 1 of the API is Chilling Reigns. Please update your application accordingly.

## Documentation Structure

This documentation has been split into several smaller files for easier navigation:

1. **Main Overview** (this file)
2. **Authentication and Rate Limits** - Information about API keys and usage limits
3. **V1 to V2 Migration Guide** - Changes between API versions
4. **Error Handling** - HTTP status codes and error responses
5. **Card Object Reference** - Detailed description of the Card object and its attributes
6. **Set Object Reference** - Detailed description of the Set object and its attributes
7. **Card Endpoints** - API endpoints for retrieving and searching cards
8. **Set Endpoints** - API endpoints for retrieving and searching sets
9. **Types, Subtypes, Supertypes, and Rarities Endpoints** - Additional API endpoints