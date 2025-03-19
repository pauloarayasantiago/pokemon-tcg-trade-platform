const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Bulk frontmatter fixer that adds standardized frontmatter to markdown files
 * This script finds all markdown files that don't have frontmatter and adds
 * a standardized template based on the file path and name.
 */

// Configuration for different documentation types
const DOCUMENTATION_TYPES = {
  'docs/pokemon_tcg_api_docs': {
    type: 'api',
    version: '1.0.0',
    tags: ['api', 'pokemon-tcg', 'reference']
  },
  'docs/components': {
    type: 'component',
    version: '1.0.0',
    tags: ['component', 'ui', 'reference']
  },
  'docs/api': {
    type: 'api',
    version: '1.0.0',
    tags: ['api', 'reference']
  },
  'docs/inventory-management': {
    type: 'feature',
    version: '1.0.0',
    tags: ['inventory', 'feature', 'user-guide']
  },
  'docs': {
    type: 'generic',
    version: '1.0.0',
    tags: ['documentation']
  }
};

/**
 * Extracts frontmatter from markdown content
 * @param {string} content - The markdown content
 * @returns {Object|null} - The parsed frontmatter or null if not found
 */
function extractFrontmatter(content) {
  // More flexible regex that handles different line endings and whitespace
  const frontmatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---/;
  const match = content.match(frontmatterRegex);
  
  if (match && match[1]) {
    try {
      return yaml.load(match[1]);
    } catch (e) {
      console.error('Error parsing frontmatter YAML:', e);
      return null;
    }
  }
  
  return null;
}

/**
 * Converts a file path to a title
 * @param {string} filePath - The file path
 * @returns {string} - A friendly title
 */
function filePathToTitle(filePath) {
  // Get the file name without extension
  const baseName = path.basename(filePath, '.md');
  
  // Convert kebab case and snake case to spaces
  const spacedName = baseName.replace(/-/g, ' ').replace(/_/g, ' ');
  
  // Handle numbered files (like 01_overview.md) by removing leading numbers
  const cleanName = spacedName.replace(/^\d+[\s_-]+/, '');
  
  // Capitalize words
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determines the best documentation type based on file path
 * @param {string} filePath - The file path
 * @returns {Object} - Documentation type configuration
 */
function getDocumentationType(filePath) {
  for (const [dirPath, config] of Object.entries(DOCUMENTATION_TYPES)) {
    if (filePath.includes(dirPath)) {
      return config;
    }
  }
  return DOCUMENTATION_TYPES['docs']; // Default to generic
}

/**
 * Adds frontmatter to a file if it doesn't already have it
 * @param {string} filePath - Path to the markdown file
 * @returns {boolean} - Whether frontmatter was added
 */
function addFrontmatterToFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it already has frontmatter
  if (extractFrontmatter(content)) {
    console.log(`  Already has frontmatter. Skipping.`);
    return false;
  }
  
  // Generate a title from the file path
  const title = filePathToTitle(filePath);
  
  // Get the document type configuration
  const docTypeConfig = getDocumentationType(filePath);
  
  // Generate frontmatter
  const frontmatter = {
    title: title,
    version: docTypeConfig.version,
    last_updated: new Date().toISOString().split('T')[0],
    status: "Active",
    tags: docTypeConfig.tags
  };
  
  // Add document type specific properties
  if (docTypeConfig.type === 'api') {
    frontmatter.api_version = '1.0.0';
    if (title.toLowerCase().includes('endpoint')) {
      frontmatter.endpoint = `/api/${title.toLowerCase().replace(' endpoint', '')}`;
      frontmatter.method = 'GET';
    }
  } else if (docTypeConfig.type === 'component') {
    frontmatter.component_name = title.replace(' Component', '');
    frontmatter.dependencies = [];
  }
  
  // Generate the frontmatter YAML
  const frontmatterYaml = yaml.dump(frontmatter);
  
  // Add the frontmatter to the content
  const newContent = `---\n${frontmatterYaml}---\n\n${content.trim()}`;
  
  // Write the file
  fs.writeFileSync(filePath, newContent);
  
  console.log(`  ✅ Added frontmatter to: ${filePath}`);
  return true;
}

/**
 * Process all markdown files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {Array<string>} excludePaths - Paths to exclude
 * @returns {number} - Number of files processed
 */
function processDirectory(dirPath, excludePaths = []) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let processedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    // Skip excluded paths
    if (excludePaths.some(excludePath => fullPath.includes(excludePath))) {
      continue;
    }
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      processedCount += processDirectory(fullPath, excludePaths);
    } else if (file.name.endsWith('.md')) {
      // Process markdown files
      if (addFrontmatterToFile(fullPath)) {
        processedCount++;
      }
    }
  }
  
  return processedCount;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] || 'docs';
  const excludePaths = args.slice(1) || [];
  
  console.log(`Processing markdown files in ${rootDir}...`);
  console.log(`Excluding paths: ${excludePaths.length > 0 ? excludePaths.join(', ') : 'None'}`);
  
  const processedCount = processDirectory(rootDir, excludePaths);
  
  console.log(`\nDone! Added frontmatter to ${processedCount} files.`);
}

main(); 