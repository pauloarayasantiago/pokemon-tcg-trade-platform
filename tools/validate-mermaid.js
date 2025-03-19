const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = path.join(process.cwd(), 'docs');

function validateMermaid() {
  console.log('Validating Mermaid diagrams...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', { cwd: DOCS_DIR });
  let totalFiles = 0;
  let filesWithDiagrams = 0;
  let validDiagrams = 0;
  let errors = [];

  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for Mermaid diagrams
    const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)```/g) || [];
    
    if (mermaidBlocks.length > 0) {
      filesWithDiagrams++;
      
      mermaidBlocks.forEach((block, index) => {
        const diagram = block.replace(/```mermaid\n/, '').replace(/```$/, '');
        
        // Basic validation rules
        if (!diagram.includes('graph') && !diagram.includes('sequence') && !diagram.includes('class')) {
          errors.push(`${file}: Diagram ${index + 1} is not a valid Mermaid diagram type`);
          return;
        }

        // Check for undefined nodes
        if (diagram.includes('undefined')) {
          errors.push(`${file}: Diagram ${index + 1} contains undefined nodes`);
          return;
        }

        // Check for valid connections
        const lines = diagram.split('\n');
        lines.forEach(line => {
          if (line.includes('-->') || line.includes('--')) {
            const [source, target] = line.split(/--|-->/).map(s => s.trim());
            if (!source || !target) {
              errors.push(`${file}: Diagram ${index + 1} has invalid connection: ${line}`);
            }
          }
        });

        validDiagrams++;
      });
    }
  });

  // Print results
  console.log('\nMermaid Diagram Validation Results:');
  console.log(`Total documentation files: ${totalFiles}`);
  console.log(`Files with diagrams: ${filesWithDiagrams}`);
  console.log(`Valid diagrams: ${validDiagrams}`);
  console.log(`Invalid diagrams: ${filesWithDiagrams - validDiagrams}`);
  console.log(`Coverage: ${((filesWithDiagrams / totalFiles) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('\nAll Mermaid diagrams are valid!');
}

validateMermaid(); 