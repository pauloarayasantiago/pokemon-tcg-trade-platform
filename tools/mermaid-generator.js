#!/usr/bin/env node

/**
 * Mermaid Diagram Template Generator
 * 
 * This script generates mermaid diagram templates to help document authors
 * quickly create visualizations for documentation files.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Diagram templates
const templates = {
  flowchart: `flowchart TD
    A[Start] --> B{Decision Point}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
    
    style A fill:#d4f1f9,stroke:#0077b6
    style E fill:#d4f1f9,stroke:#0077b6
    style B fill:#ffe8d6,stroke:#bc6c25`,

  sequence: `sequenceDiagram
    actor User
    participant A as Component A
    participant B as Component B
    participant C as Component C
    
    User->>A: Action
    A->>B: Request
    B->>C: Process
    C-->>B: Response
    B-->>A: Result
    A-->>User: Display`,

  class: `classDiagram
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
    
    Entity1 "1" -- "many" Entity2`,

  er: `erDiagram
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
    }`,

  state: `stateDiagram-v2
    [*] --> InitialState
    InitialState --> State2: Event1
    State2 --> State3: Event2
    State3 --> InitialState: Event3
    State3 --> [*]: Complete`,

  gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    
    section Phase 1
    Task 1   :a1, 2023-01-01, 10d
    Task 2   :a2, after a1, 15d
    
    section Phase 2
    Task 3   :b1, after a2, 10d
    Task 4   :b2, after b1, 7d`,

  pie: `pie
    title Distribution Title
    "Segment 1" : 40
    "Segment 2" : 30
    "Segment 3" : 20
    "Segment 4" : 10`,

  system: `flowchart TD
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
    style Backend fill:#fff2e6,stroke:#ff6600`
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function main() {
  console.log(`
╔════════════════════════════════════════════════╗
║   Mermaid Diagram Template Generator v1.0.0    ║
╚════════════════════════════════════════════════╝
  
This tool generates mermaid diagram templates for documentation.
  `);

  // Ask for diagram type
  const diagramType = await askQuestion(`Select diagram type:
  1. Flowchart (process flows, decision trees)
  2. Sequence Diagram (component interactions)
  3. Class Diagram (data models, class relationships)
  4. Entity Relationship Diagram (database schemas)
  5. State Diagram (state machines, transitions)
  6. Gantt Chart (timelines, project planning)
  7. Pie Chart (distribution, proportions)
  8. System Architecture (frontend/backend layers)

Enter number (1-8): `);

  const typeMap = {
    '1': 'flowchart',
    '2': 'sequence',
    '3': 'class',
    '4': 'er',
    '5': 'state',
    '6': 'gantt',
    '7': 'pie',
    '8': 'system'
  };

  const selectedType = typeMap[diagramType];
  
  if (!selectedType) {
    console.log('Invalid selection. Please try again.');
    rl.close();
    return;
  }

  // Ask for output options
  const outputOption = await askQuestion(`
How would you like to output the diagram template?
  1. Print to console
  2. Copy to clipboard
  3. Save to file
  4. Insert into existing markdown file

Enter number (1-4): `);

  let template = templates[selectedType];
  let markdownTemplate = '```mermaid\n' + template + '\n```';

  switch (outputOption) {
    case '1':
      // Print to console
      console.log('\nHere\'s your mermaid diagram template:\n');
      console.log(markdownTemplate);
      addUsageInstructions();
      break;
    
    case '2':
      // Copy to clipboard (simulated)
      console.log('\nTemplate copied to clipboard (you\'ll need to manually copy it):\n');
      console.log(markdownTemplate);
      addUsageInstructions();
      break;
    
    case '3':
      // Save to file
      const filename = await askQuestion('Enter filename (e.g., diagram.md): ');
      try {
        fs.writeFileSync(filename, markdownTemplate);
        console.log(`\nTemplate saved to ${filename}`);
        addUsageInstructions();
      } catch (err) {
        console.error('Error saving file:', err.message);
      }
      break;
    
    case '4':
      // Insert into existing markdown file
      const targetFile = await askQuestion('Enter target markdown file path: ');
      
      if (!fs.existsSync(targetFile)) {
        console.log(`Error: File ${targetFile} does not exist.`);
        break;
      }
      
      try {
        const fileContent = fs.readFileSync(targetFile, 'utf8');
        const updatedFrontmatter = updateFrontmatter(fileContent);
        const insertPosition = await askQuestion(
          'Where should the diagram be inserted?\n' +
          '1. At the end of the file\n' +
          '2. After a specific heading\n' +
          'Enter number (1-2): '
        );
        
        let newContent;
        
        if (insertPosition === '1') {
          newContent = updatedFrontmatter + '\n\n' + markdownTemplate;
        } else if (insertPosition === '2') {
          const heading = await askQuestion('Enter the heading text (e.g., "## Overview"): ');
          newContent = insertAfterHeading(updatedFrontmatter, heading, markdownTemplate);
        } else {
          console.log('Invalid selection.');
          break;
        }
        
        fs.writeFileSync(targetFile, newContent);
        console.log(`\nDiagram inserted into ${targetFile}`);
        addUsageInstructions();
      } catch (err) {
        console.error('Error updating file:', err.message);
      }
      break;
    
    default:
      console.log('Invalid selection.');
  }

  rl.close();
}

// Helper function to update frontmatter with has_mermaid: true
function updateFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return content;
  
  const frontmatter = match[1];
  if (frontmatter.includes('has_mermaid:')) {
    // Replace has_mermaid value with true
    const updatedFrontmatter = frontmatter.replace(
      /has_mermaid:\s*(false|true)/,
      'has_mermaid: true'
    );
    return content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
  } else {
    // Add has_mermaid: true to frontmatter
    const updatedFrontmatter = frontmatter + '\nhas_mermaid: true';
    return content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
  }
}

// Helper function to insert content after a specific heading
function insertAfterHeading(content, heading, diagramMarkdown) {
  const headingRegex = new RegExp(`(${heading}\\s*\n)`);
  const match = content.match(headingRegex);
  
  if (!match) {
    console.log(`Warning: Heading "${heading}" not found. Appending to end of file.`);
    return content + '\n\n' + diagramMarkdown;
  }
  
  const index = match.index + match[0].length;
  return content.slice(0, index) + '\n' + diagramMarkdown + '\n' + content.slice(index);
}

// Helper function for prompting the user
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Add usage instructions
function addUsageInstructions() {
  console.log('\n--------------------------------------------------');
  console.log('USAGE INSTRUCTIONS:');
  console.log('1. Add this diagram to your markdown file');
  console.log('2. Make sure the frontmatter includes: has_mermaid: true');
  console.log('3. Add a text description explaining the diagram');
  console.log('4. Validate with: npm run validate-docs');
  console.log('--------------------------------------------------');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  rl.close();
}); 