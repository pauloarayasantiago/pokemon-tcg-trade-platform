const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = 'docs';

// Template diagrams for different documentation types
const diagramTemplates = {
  api: `\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database
    
    Client->>API: HTTP Request
    API->>Database: Query Data
    Database-->>API: Return Results
    API-->>Client: HTTP Response
\`\`\``,
  
  component: `\`\`\`mermaid
graph TD
    A[Component] --> B[Child Component 1]
    A --> C[Child Component 2]
    B --> D[Subcomponent 1]
    C --> E[Subcomponent 2]
\`\`\``,
  
  flow: `\`\`\`mermaid
flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\``,
  
  database: `\`\`\`mermaid
erDiagram
    ENTITY1 ||--o{ ENTITY2 : has
    ENTITY1 {
        string id
        string name
        timestamp created_at
    }
    ENTITY2 {
        string id
        string entity1_id
        string data
    }
\`\`\``,
  
  default: `\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\``,
};

// Function to determine diagram type based on file path and content
function getDiagramType(filePath, content) {
  const fileName = path.basename(filePath).toLowerCase();
  const fileContent = content.toLowerCase();
  
  if (fileName.includes('api') || fileContent.includes('endpoint') || fileContent.includes('http')) {
    return 'api';
  }
  if (fileName.includes('component') || fileContent.includes('component')) {
    return 'component';
  }
  if (fileName.includes('flow') || fileContent.includes('workflow') || fileContent.includes('process')) {
    return 'flow';
  }
  if (fileName.includes('database') || fileName.includes('model') || fileContent.includes('database') || fileContent.includes('schema')) {
    return 'database';
  }
  return 'default';
}

// Function to add a template diagram to a file
function addMermaidTemplate(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const content = fs.readFileSync(normalizedPath, 'utf8');
  
  // Skip if file already has a mermaid diagram
  if (content.includes('```mermaid')) {
    console.log(`Skipping ${normalizedPath} - already has mermaid diagram`);
    return;
  }
  
  const diagramType = getDiagramType(normalizedPath, content);
  const template = diagramTemplates[diagramType];
  
  // Add template after the first heading
  const lines = content.split('\n');
  const headingIndex = lines.findIndex(line => line.startsWith('#'));
  
  if (headingIndex === -1) {
    // If no heading found, add at the end
    lines.push('\n## Diagram\n');
    lines.push(template);
  } else {
    // Add after the first paragraph following the heading
    let insertIndex = headingIndex + 1;
    while (insertIndex < lines.length && lines[insertIndex].trim() !== '') {
      insertIndex++;
    }
    lines.splice(insertIndex, 0, '\n## Diagram\n');
    lines.splice(insertIndex + 1, 0, template);
  }
  
  const newContent = lines.join('\n');
  fs.writeFileSync(normalizedPath, newContent);
  console.log(`Added ${diagramType} diagram template to ${normalizedPath}`);
}

// Find all markdown files in the docs directory
const docFiles = glob.sync('**/*.md', { 
  cwd: DOCS_DIR,
  absolute: true,
  windowsPathsNoEscape: true
});

// Process each file
docFiles.forEach(file => {
  const filePath = path.resolve(DOCS_DIR, file);
  addMermaidTemplate(filePath);
});

console.log('Mermaid template addition complete!'); 