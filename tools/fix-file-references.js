const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = path.join(process.cwd(), 'docs');

// Function to get all markdown files
function getAllMarkdownFiles() {
  return glob.sync('**/*.md', { cwd: DOCS_DIR });
}

// Function to fix file references in a markdown file
function fixFileReferences(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix relative paths
  content = content.replace(/\[([^\]]+)\]\(\.\.?\/([^)]+)\)/g, (match, text, filePath) => {
    const absolutePath = path.resolve(path.dirname(filePath), filePath);
    const relativePath = path.relative(path.dirname(filePath), absolutePath);
    return `[${text}](${relativePath})`;
  });
  
  // Fix absolute paths
  content = content.replace(/\[([^\]]+)\]\(docs\/([^)]+)\)/g, (match, text, filePath) => {
    return `[${text}](${filePath})`;
  });
  
  // Fix anchor links
  content = content.replace(/\[([^\]]+)\]\(#([^)]+)\)/g, (match, text, anchor) => {
    return `[${text}](#${anchor.toLowerCase().replace(/\s+/g, '-')})`;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed file references in ${filePath}`);
}

// Main function
function main() {
  const files = getAllMarkdownFiles();
  console.log(`Found ${files.length} markdown files`);
  
  files.forEach(file => {
    const filePath = path.join(DOCS_DIR, file);
    fixFileReferences(filePath);
  });
  
  console.log('Finished fixing file references');
}

main(); 