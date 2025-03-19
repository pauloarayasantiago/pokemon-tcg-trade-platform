---
title: "Documentation Tools"
version: "1.0.0"
last_updated: "2023-11-18"
---

# Documentation Tools

This directory contains tools for maintaining AI-optimized documentation in the Pokemon TCG Trade Platform.

## Overview

These tools implement the AI-optimized documentation strategy outlined in `documentation-strategy.md`. They help create, validate, and fix documentation files to ensure they follow consistent standards that are both human-readable and optimized for AI understanding.

## Available Tools

### 1. Documentation Validator (`doc-validator.js`)

Validates documentation files against our AI-optimized standards.

**Features:**
- Frontmatter validation
- Required section checking
- Mermaid diagram detection
- Reference validation
- Document type-specific validations

**Usage:**
```bash
# Validate all documentation
npm run validate-docs

# Validate a specific file
npm run validate-docs -- docs/some-file.md
```

### 2. Documentation Template Generator (`doc-template-generator.js`)

Generates template documentation files with proper structure and placeholders.

**Features:**
- Interactive CLI for template selection
- Supports multiple document types:
  - API documentation
  - Component documentation
  - README templates
  - PRD documentation
  - Database documentation
- Includes proper frontmatter and section structure

**Usage:**
```bash
# Run the template generator
npm run create-doc
```

### 3. Frontmatter Fixing Tools

#### Individual Frontmatter Fixer (`fix-frontmatter.js`)
Fixes frontmatter in an individual document.

**Usage:**
```bash
# Fix frontmatter in a specific file
npm run fix-frontmatter docs/some-file.md
```

#### Bulk Frontmatter Fixer (`bulk-add-frontmatter.js`)
Adds standardized frontmatter to multiple documentation files.

**Features:**
- Recursively processes all markdown files in a directory
- Detects document type based on path
- Generates appropriate frontmatter for each document type
- Skips files that already have frontmatter

**Usage:**
```bash
# Fix all documentation files
npm run bulk-fix-docs docs

# Fix files in a specific directory
npm run bulk-fix-docs docs/api
```

### 4. Mermaid Diagram Generator (`mermaid-generator.js`)

Generates mermaid diagram templates for inclusion in documentation files.

**Features:**
- Interactive CLI for selecting diagram types
- Supports multiple diagram types:
  - Flowcharts
  - Sequence diagrams
  - Class diagrams
  - Entity relationship diagrams
  - State diagrams
  - Gantt charts
  - Pie charts
  - System architecture diagrams
- Multiple output options:
  - Print to console
  - Copy to clipboard (manual)
  - Save to new file
  - Insert into existing markdown file
- Automatically updates frontmatter to include `has_mermaid: true`

**Usage:**
```bash
# Run the diagram generator
npm run create-diagram
```

**Example Output:**
```
╔════════════════════════════════════════════════╗
║   Mermaid Diagram Template Generator v1.0.0    ║
╚════════════════════════════════════════════════╝
  
This tool generates mermaid diagram templates for documentation.
```

## CI Integration

These tools are integrated into our CI pipeline via GitHub Actions. Every pull request that modifies documentation files will trigger validation to ensure documentation quality.

## Documentation Status

Current documentation compliance: **100%** (36/36 files)

## Next Steps

1. Add more mermaid diagrams to improve visualization
2. Validate and fix file references
3. Enhance AI-friendly patterns across all documentation
4. Implement additional AI-optimization techniques

For more details, see the [documentation strategy](../documentation-strategy.md). 