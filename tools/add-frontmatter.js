const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');

const DOCS_DIR = 'docs';

// Template for frontmatter
function generateFrontmatter(filePath, hasMermaid = false) {
  const fileName = path.basename(filePath, '.md')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: fileName,
    type: "technical-document",
    description: `Documentation for ${fileName}`,
    author: "Documentation Team",
    version: "1.0.0",
    last_updated: new Date().toISOString().split('T')[0],
    status: "draft",
    category: "documentation",
    has_mermaid: hasMermaid
  };
}

// Function to check if file contains mermaid diagrams
function hasMermaidDiagrams(content) {
  return content.includes('```mermaid');
}

// Function to parse existing frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  try {
    return yaml.load(match[1]);
  } catch (e) {
    console.error('Error parsing frontmatter:', e);
    return null;
  }
}

// Function to add or update frontmatter in a file
function addOrUpdateFrontmatter(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const content = fs.readFileSync(normalizedPath, 'utf8');
  
  let existingFrontmatter = parseFrontmatter(content);
  const hasMermaid = hasMermaidDiagrams(content);
  
  // Generate new frontmatter
  const newFrontmatter = generateFrontmatter(normalizedPath, hasMermaid);
  
  // Merge with existing frontmatter if it exists
  const finalFrontmatter = {
    ...newFrontmatter,
    ...existingFrontmatter,
    has_mermaid: hasMermaid // Always update has_mermaid based on content
  };

  // Convert status to valid value if needed
  if (finalFrontmatter.status === 'active') {
    finalFrontmatter.status = 'published';
  }

  // Generate frontmatter string
  const frontmatterStr = `---\n${yaml.dump(finalFrontmatter)}---\n`;
  
  // Replace existing frontmatter or add new frontmatter
  const newContent = existingFrontmatter
    ? content.replace(/^---\n[\s\S]*?\n---\n/, frontmatterStr)
    : frontmatterStr + content;
  
  fs.writeFileSync(normalizedPath, newContent);
  console.log(`Updated frontmatter in ${normalizedPath}`);
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
  addOrUpdateFrontmatter(filePath);
});

console.log('Frontmatter update complete!'); 