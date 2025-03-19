#!/usr/bin/env node

/**
 * @fileOverview Documentation template generator for AI-optimized documentation
 * This tool generates template markdown files based on the AI-optimized documentation standards
 * described in documentation-strategy.md
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Templates for different document types
const TEMPLATES = {
  readme: `---
title: "{TITLE}"
version: "0.1.0"
updated: "{DATE}"
repository: "https://github.com/username/pokemontcg-trade-platform"
tech_stack:
  next.js: "14.0.0"
  react: "18.2.0"
  typescript: "5.3.3"
  supabase: "2.39.3"
---

# {TITLE}

<purpose>
{PURPOSE}
</purpose>

## Features

<features>
- Feature 1
- Feature 2
- Feature 3
</features>

## Getting Started

<installation_steps>
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/username/project-name.git
   cd project-name
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
</installation_steps>

## Directory Structure

<directory_structure>
- \`src/\` - Source code
  - \`app/\` - Next.js application routes and pages
  - \`components/\` - React components
  - \`lib/\` - Utility functions and services
- \`public/\` - Static assets
- \`docs/\` - Documentation
</directory_structure>
`,

  component: `---
title: "Component Documentation: {COMPONENT_NAME}"
component_name: "{COMPONENT_NAME}"
path: "{COMPONENT_PATH}"
implements: []
dependencies:
  - "dependency1"
  - "dependency2"
version: "0.1.0"
last_updated: "{DATE}"
---

# {COMPONENT_NAME} Component

<purpose>
{PURPOSE}
</purpose>

## Props

<props>
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop1 | string | Yes | - | Description of prop1 |
| prop2 | number | No | 0 | Description of prop2 |
| prop3 | boolean | No | false | Description of prop3 |
</props>

## Usage Examples

<usage_example>
\`\`\`tsx
<{COMPONENT_NAME} 
  prop1="value"
  prop2={42}
  prop3={true}
/>
\`\`\`
</usage_example>

## Implementation Details

<implementation_details>
The component implements the following functionality:
- Feature 1
- Feature 2
- Feature 3
</implementation_details>

## Test Coverage

<test_coverage>
- Unit tests: \`src/components/__tests__/{COMPONENT_NAME}.test.tsx\`
</test_coverage>

## Accessibility

<accessibility>
- Keyboard navigation: Yes
- Screen reader support: Yes
- Color contrast ratio: WCAG AA compliant
</accessibility>
`,

  api: `---
title: "API Documentation: {API_NAME}"
endpoint: "{API_ENDPOINT}"
method: "{API_METHOD}"
version: "1.0"
auth_required: {AUTH_REQUIRED}
rate_limit: "100 requests/minute"
implementation: "{IMPLEMENTATION_PATH}"
last_updated: "{DATE}"
---

# {API_NAME} API

<description>
{DESCRIPTION}
</description>

## Request Schema

<request_schema>
\`\`\`json
{
  "type": "object",
  "properties": {
    "property1": {
      "type": "string",
      "description": "Description of property1"
    },
    "property2": {
      "type": "number",
      "description": "Description of property2"
    }
  },
  "required": ["property1"]
}
\`\`\`
</request_schema>

## Response Schema

<response_schema>
\`\`\`json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier"
        },
        "name": {
          "type": "string",
          "description": "Name"
        }
      }
    }
  }
}
\`\`\`
</response_schema>

## Example Request

<example_request>
\`\`\`javascript
fetch('{API_ENDPOINT}', {
  method: '{API_METHOD}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    property1: "value1",
    property2: 42
  })
});
\`\`\`
</example_request>

## Example Response

<example_response>
\`\`\`json
{
  "data": {
    "id": "123",
    "name": "Example"
  }
}
\`\`\`
</example_response>

## Error Codes

<error_codes>
| Status Code | Error Code | Description | Resolution |
|-------------|------------|-------------|------------|
| 400 | INVALID_REQUEST | Invalid request format | Check request format |
| 401 | UNAUTHORIZED | Missing or invalid token | Provide valid token |
| 429 | RATE_LIMITED | Too many requests | Reduce request frequency |
</error_codes>
`,

  database: `---
title: "Database Documentation: {DB_NAME}"
version: "1.0.0"
last_updated: "{DATE}"
status: "Active"
---

# {DB_NAME} Database Documentation

## Overview

<purpose>
{PURPOSE}
</purpose>

## Database Schema

<database_structure>
### Table: table_name

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| id | uuid | NO | Primary Key |
| name | text | NO | Name |
| description | text | YES | Description |
| created_at | timestamp | YES | Creation timestamp |

### Table: related_table

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| id | uuid | NO | Primary Key |
| table_id | uuid | NO | Foreign key to table_name.id |
| value | text | NO | Value |
| created_at | timestamp | YES | Creation timestamp |
</database_structure>

## Entity Relationships

\`\`\`mermaid
erDiagram
    table_name ||--o{ related_table : "has many"
    table_name {
        uuid id PK
        string name
        string description
        timestamp created_at
    }
    related_table {
        uuid id PK
        uuid table_id FK
        string value
        timestamp created_at
    }
\`\`\`

## Common Queries

<query_examples>
### Retrieve records with related data

\`\`\`sql
SELECT t.*, r.value
FROM table_name t
LEFT JOIN related_table r ON t.id = r.table_id
WHERE t.name LIKE '%search_term%'
ORDER BY t.created_at DESC
LIMIT 10;
\`\`\`

### Insert new record with related records

\`\`\`sql
-- Insert main record
INSERT INTO table_name (name, description)
VALUES ('New Record', 'Description')
RETURNING id;

-- Insert related records
INSERT INTO related_table (table_id, value)
VALUES 
  ('returned-id', 'Value 1'),
  ('returned-id', 'Value 2');
\`\`\`
</query_examples>

## Indexing Strategy

<indexing>
### Performance Considerations

The following indexes are implemented:

1. **table_name_name_idx**
   - Table: table_name
   - Column: name
   - Type: B-tree
   - Purpose: Improve search performance by name

2. **related_table_table_id_idx**
   - Table: related_table
   - Column: table_id
   - Type: B-tree
   - Purpose: Improve join performance
</indexing>

## Data Synchronization

<sync_process>
### Synchronization Workflow

The data synchronization process follows these steps:

1. External data is retrieved from the source
2. Data is validated and normalized
3. Records are upserted into the database
4. Post-processing is performed
5. Sync status is updated
</sync_process>
`,

  prd: `---
title: "{TITLE} - Product Requirements Document"
version: "1.0.0"
last_updated: "{DATE}"
status: "Draft"
owner: "Product Team"
tags:
  - "requirements"
  - "tag2"
  - "tag3"
---

# {TITLE} - Product Requirements Document

## Executive Summary

<summary>
{SUMMARY}
</summary>

## Business Goals

<business_goals>
1. Goal 1
2. Goal 2
3. Goal 3
</business_goals>

## Target Users

<target_users>
### Primary User Personas

1. **Persona 1**
   - Description
   - Needs
   - Behaviors

2. **Persona 2**
   - Description
   - Needs
   - Behaviors
</target_users>

## Core Feature Requirements

<requirement id="REQ-001" type="Functional" priority="Must-Have" status="Draft">

### Feature Title

Description of the feature requirement.

#### Acceptance Criteria:
- Criterion 1
- Criterion 2
- Criterion 3

#### Dependencies:
- REQ-002 (Related Requirement)

#### Implementation Files:
- \`src/components/feature.tsx\`

</requirement>

<requirement id="REQ-002" type="Functional" priority="Should-Have" status="Draft">

### Another Feature

Description of another feature requirement.

#### Acceptance Criteria:
- Criterion 1
- Criterion 2
- Criterion 3

#### Implementation Files:
- \`src/components/another-feature.tsx\`

</requirement>

## Technical Requirements

<technical_requirements>
1. **Category 1**
   - Requirement 1
   - Requirement 2
   - Requirement 3

2. **Category 2**
   - Requirement 1
   - Requirement 2
   - Requirement 3
</technical_requirements>

## Constraints and Limitations

<constraints>
1. **Constraint Category 1**
   - Limitation 1
   - Limitation 2

2. **Constraint Category 2**
   - Limitation 1
   - Limitation 2
</constraints>

## Success Metrics

<success_metrics>
1. **Metric 1**
   - Target value
   - Measurement method

2. **Metric 2**
   - Target value
   - Measurement method
</success_metrics>
`
};

// Format current date as YYYY-MM-DD
function getFormattedDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Create the readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input with a default value
function prompt(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Main function to generate a template
async function generateTemplate() {
  console.log('Documentation Template Generator\n');
  
  // Get template type
  console.log('Available templates:');
  console.log('1. README');
  console.log('2. Component Documentation');
  console.log('3. API Documentation');
  console.log('4. Database Documentation');
  console.log('5. Product Requirements Document (PRD)');
  
  const templateChoice = await prompt('Select template type (1-5)', '1');
  
  let templateType, template, outputPath;
  
  switch (templateChoice) {
    case '1':
      templateType = 'readme';
      template = TEMPLATES.readme;
      
      const readmeTitle = await prompt('Project title', 'My Project');
      const readmePurpose = await prompt('Project purpose', 'A brief description of the project.');
      outputPath = await prompt('Output file path', 'README.md');
      
      template = template
        .replace(/{TITLE}/g, readmeTitle)
        .replace(/{PURPOSE}/g, readmePurpose)
        .replace(/{DATE}/g, getFormattedDate());
      break;
      
    case '2':
      templateType = 'component';
      template = TEMPLATES.component;
      
      const componentName = await prompt('Component name', 'MyComponent');
      const componentPath = await prompt('Component path', `src/components/${componentName}.tsx`);
      const componentPurpose = await prompt('Component purpose', 'A brief description of the component.');
      outputPath = await prompt('Output file path', `docs/components/${componentName}.md`);
      
      template = template
        .replace(/{COMPONENT_NAME}/g, componentName)
        .replace(/{COMPONENT_PATH}/g, componentPath)
        .replace(/{PURPOSE}/g, componentPurpose)
        .replace(/{DATE}/g, getFormattedDate());
      break;
      
    case '3':
      templateType = 'api';
      template = TEMPLATES.api;
      
      const apiName = await prompt('API name', 'My API');
      const apiEndpoint = await prompt('API endpoint', '/api/resource');
      const apiMethod = await prompt('API method', 'POST');
      const apiAuthRequired = await prompt('Authentication required? (true/false)', 'true');
      const apiDescription = await prompt('API description', 'A brief description of the API.');
      const apiImplementationPath = await prompt('Implementation path', `src/app/api/resource/route.ts`);
      outputPath = await prompt('Output file path', `docs/api/${apiName.toLowerCase().replace(/\s+/g, '-')}.md`);
      
      template = template
        .replace(/{API_NAME}/g, apiName)
        .replace(/{API_ENDPOINT}/g, apiEndpoint)
        .replace(/{API_METHOD}/g, apiMethod)
        .replace(/{AUTH_REQUIRED}/g, apiAuthRequired)
        .replace(/{DESCRIPTION}/g, apiDescription)
        .replace(/{IMPLEMENTATION_PATH}/g, apiImplementationPath)
        .replace(/{DATE}/g, getFormattedDate());
      break;
      
    case '4':
      templateType = 'database';
      template = TEMPLATES.database;
      
      const dbName = await prompt('Database name', 'My Database');
      const dbPurpose = await prompt('Database purpose', 'A brief description of the database.');
      outputPath = await prompt('Output file path', `docs/database-documentation.md`);
      
      template = template
        .replace(/{DB_NAME}/g, dbName)
        .replace(/{PURPOSE}/g, dbPurpose)
        .replace(/{DATE}/g, getFormattedDate());
      break;
      
    case '5':
      templateType = 'prd';
      template = TEMPLATES.prd;
      
      const prdTitle = await prompt('Project title', 'My Project');
      const prdSummary = await prompt('Executive summary', 'A brief summary of the project.');
      outputPath = await prompt('Output file path', `docs/${prdTitle.toLowerCase().replace(/\s+/g, '-')}-prd.md`);
      
      template = template
        .replace(/{TITLE}/g, prdTitle)
        .replace(/{SUMMARY}/g, prdSummary)
        .replace(/{DATE}/g, getFormattedDate());
      break;
      
    default:
      console.log('Invalid choice. Using README template.');
      templateType = 'readme';
      template = TEMPLATES.readme;
      outputPath = 'README.md';
      break;
  }
  
  // Create directory if it doesn't exist
  const directory = path.dirname(outputPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  
  // Write template to file
  fs.writeFileSync(outputPath, template);
  
  console.log(`\n✅ Template generated successfully!`);
  console.log(`File created: ${outputPath}`);
  
  rl.close();
}

// Run the generator
generateTemplate(); 