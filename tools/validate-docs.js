const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = path.join(process.cwd(), 'docs');

function validateDocs() {
  console.log('Validating documentation...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', { cwd: DOCS_DIR });
  let totalFiles = 0;
  let validFiles = 0;
  let errors = [];

  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for basic markdown structure
    if (!content.includes('# ')) {
      errors.push(`${file}: Missing main heading`);
      return;
    }

    // Check for proper heading hierarchy
    const headings = content.match(/^#{1,6}\s/gm) || [];
    if (headings.length === 0) {
      errors.push(`${file}: No headings found`);
      return;
    }

    // Check for proper code block formatting
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    codeBlocks.forEach(block => {
      if (!block.includes('\n')) {
        errors.push(`${file}: Code block missing newline`);
      }
    });

    validFiles++;
  });

  // Print results
  console.log('\nDocumentation Validation Results:');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Valid files: ${validFiles}`);
  console.log(`Invalid files: ${totalFiles - validFiles}`);
  console.log(`Validation rate: ${((validFiles / totalFiles) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('\nAll documentation files are valid!');
}

validateDocs(); 