const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = path.join(process.cwd(), 'docs');

function checkDocReferences() {
  console.log('Checking documentation references...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', { cwd: DOCS_DIR });
  let totalFiles = 0;
  let validFiles = 0;
  let errors = [];

  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for file references in markdown links
    const fileRefs = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    fileRefs.forEach(ref => {
      const match = ref.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!match) return;

      const [, text, url] = match;
      
      // Skip external URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return;
      }

      // Check if the referenced file exists
      const refPath = path.join(path.dirname(filePath), url);
      if (!fs.existsSync(refPath)) {
        errors.push(`${file}: Invalid file reference "${text}" -> "${url}"`);
      }
    });

    validFiles++;
  });

  // Print results
  console.log('\nFile Reference Validation Results:');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Files with valid references: ${validFiles}`);
  console.log(`Files with invalid references: ${totalFiles - validFiles}`);
  console.log(`Validation rate: ${((validFiles / totalFiles) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('\nAll file references are valid!');
}

checkDocReferences(); 