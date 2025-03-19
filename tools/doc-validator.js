#!/usr/bin/env node

/**
 * @fileOverview Documentation validator for AI-optimized documentation
 * This tool validates markdown files against the AI-optimized documentation standards
 * described in documentation-strategy.md
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const glob = require('glob');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  requiredFrontmatterFields: {
    all: ['title', 'version', 'last_updated'],
    prd: ['status', 'owner', 'tags'],
    component: ['component_name', 'path', 'dependencies'],
    api: ['endpoint', 'method', 'auth_required'],
    changelog: ['format_version', 'repository']
  },
  requiredSections: {
    readme: ['purpose', 'features', 'installation_steps', 'directory_structure'],
    prd: ['summary', 'business_goals', 'target_users', 'requirement'],
    component: ['purpose', 'props', 'usage_example', 'implementation_details'],
    api: ['description', 'request_schema', 'response_schema', 'example_request', 'example_response'],
    database: ['database_structure', 'process', 'query_examples'],
    delivery: ['process', 'store_network', 'api_endpoints', 'error_handling'],
    whatsapp: ['integration_architecture', 'message_templates', 'security', 'api_endpoints'],
    changelog: ['changes']
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
 * Checks if a section exists in the markdown content
 * @param {string} content - The markdown content
 * @param {string} sectionName - The section name to check for
 * @returns {boolean} - Whether the section exists
 */
function hasSection(content, sectionName) {
  const sectionRegex = new RegExp(`<${sectionName}>[\\s\\S]*?</${sectionName}>`, 'i');
  return sectionRegex.test(content);
}

/**
 * Validates requirements in PRD documents
 * @param {string} content - The markdown content
 * @returns {Array} - Array of validation messages
 */
function validateRequirements(content) {
  const messages = [];
  const requirementRegex = /<requirement id="([^"]+)" type="([^"]+)" priority="([^"]+)" status="([^"]+)">/g;
  const requirementMatches = [...content.matchAll(requirementRegex)];
  
  if (requirementMatches.length === 0) {
    messages.push({
      type: 'error',
      message: 'No properly formatted requirements found. Requirements should use the <requirement> tag with id, type, priority, and status attributes.'
    });
  } else {
    messages.push({
      type: 'info',
      message: `Found ${requirementMatches.length} properly formatted requirements.`
    });
    
    // Check for requirement references
    const requirementIds = requirementMatches.map(match => match[1]);
    const referenceRegex = /REQ-\d{3}/g;
    const references = [...content.matchAll(referenceRegex)].map(match => match[0]);
    
    // Find references to non-existent requirements
    const invalidReferences = references.filter(ref => !requirementIds.includes(ref));
    if (invalidReferences.length > 0) {
      messages.push({
        type: 'warning',
        message: `Found references to non-existent requirements: ${invalidReferences.join(', ')}`
      });
    }
  }
  
  return messages;
}

/**
 * Validates API endpoints in API documentation
 * @param {string} content - The markdown content
 * @returns {Array} - Array of validation messages
 */
function validateApiEndpoints(content) {
  const messages = [];
  const endpointRegex = /#### `(GET|POST|PUT|DELETE|PATCH) (\/[^`]+)`/g;
  const endpointMatches = [...content.matchAll(endpointRegex)];
  
  if (endpointMatches.length === 0) {
    messages.push({
      type: 'warning',
      message: 'No API endpoints found in the expected format. Endpoints should be defined as #### `METHOD /path`.'
    });
  } else {
    messages.push({
      type: 'info',
      message: `Found ${endpointMatches.length} API endpoints.`
    });
    
    // Check for request/response examples
    let hasRequestExample = content.includes('<example_request>');
    let hasResponseExample = content.includes('<example_response>');
    
    if (!hasRequestExample) {
      messages.push({
        type: 'warning',
        message: 'No request examples found. Add <example_request> sections.'
      });
    }
    
    if (!hasResponseExample) {
      messages.push({
        type: 'warning',
        message: 'No response examples found. Add <example_response> sections.'
      });
    }
  }
  
  return messages;
}

/**
 * Checks if mermaid diagrams are present in the documentation
 * @param {string} content - The markdown content
 * @returns {Array} - Array of validation messages
 */
function validateMermaidDiagrams(content) {
  const messages = [];
  const mermaidRegex = /```mermaid[\s\S]*?```/g;
  const mermaidMatches = [...content.matchAll(mermaidRegex)];
  
  if (mermaidMatches.length === 0) {
    messages.push({
      type: 'warning',
      message: 'No mermaid diagrams found. Consider adding diagrams for better visualization.'
    });
  } else {
    messages.push({
      type: 'info',
      message: `Found ${mermaidMatches.length} mermaid diagrams.`
    });
  }
  
  return messages;
}

/**
 * Validates file references in documentation
 * @param {string} content - The markdown content
 * @param {string} basePath - The base path for relative file references
 * @returns {Array} - Array of validation messages
 */
function validateFileReferences(content, basePath) {
  const messages = [];
  const fileRegex = /`([^`]+\.(tsx|ts|js|jsx|md|css))`/g;
  const fileMatches = [...content.matchAll(fileRegex)];
  
  if (fileMatches.length === 0) {
    messages.push({
      type: 'info',
      message: 'No file references found.'
    });
    return messages;
  }
  
  const fileReferences = fileMatches.map(match => match[1])
    .filter(file => !file.includes('...')) // Exclude template patterns like "file.ts"
    .filter(file => file.startsWith('src/') || file.startsWith('docs/')); // Only check src/ and docs/ references
  
  let invalidFiles = 0;
  
  for (const fileRef of fileReferences) {
    const filePath = path.join(basePath, '..', fileRef);
    if (!fs.existsSync(filePath)) {
      messages.push({
        type: 'warning',
        message: `Reference to non-existent file: ${fileRef}`
      });
      invalidFiles++;
    }
  }
  
  if (invalidFiles === 0 && fileReferences.length > 0) {
    messages.push({
      type: 'info',
      message: `All ${fileReferences.length} file references are valid.`
    });
  }
  
  return messages;
}

/**
 * Determines the document type based on its path and content
 * @param {string} filePath - The path to the document
 * @param {string} content - The document content
 * @returns {string} - The document type
 */
function determineDocumentType(filePath, content) {
  const fileName = path.basename(filePath).toLowerCase();
  
  if (fileName === 'readme.md') return 'readme';
  if (fileName === 'changelog.md') return 'changelog';
  if (fileName.includes('prd') || fileName.includes('requirements')) return 'prd';
  if (content.includes('<api_endpoints>') && content.includes('<request_schema>')) return 'api';
  if (content.includes('<props>') && content.includes('<component_name>')) return 'component';
  if (content.includes('<database_structure>')) return 'database';
  if (filePath.includes('delivery')) return 'delivery';
  if (filePath.includes('whatsapp')) return 'whatsapp';
  
  return 'generic';
}

/**
 * Validates a markdown document against AI-optimized documentation standards
 * @param {string} filePath - The path to the markdown file
 * @returns {Object} - Validation results
 */
function validateDocument(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatter = extractFrontmatter(content);
  const docType = determineDocumentType(filePath, content);
  
  const results = {
    filePath,
    docType,
    messages: [],
    valid: true
  };
  
  // Validate frontmatter
  if (!frontmatter) {
    results.messages.push({
      type: 'error',
      message: 'No frontmatter found. Add YAML frontmatter between --- delimiters at the top of the file.'
    });
    results.valid = false;
  } else {
    // Check required frontmatter fields
    const requiredFields = [...CONFIG.requiredFrontmatterFields.all];
    if (CONFIG.requiredFrontmatterFields[docType]) {
      requiredFields.push(...CONFIG.requiredFrontmatterFields[docType]);
    }
    
    const missingFields = requiredFields.filter(field => !frontmatter[field]);
    if (missingFields.length > 0) {
      results.messages.push({
        type: 'error',
        message: `Missing required frontmatter fields: ${missingFields.join(', ')}`
      });
      results.valid = false;
    }
  }
  
  // Validate required sections
  if (CONFIG.requiredSections[docType]) {
    const requiredSections = CONFIG.requiredSections[docType];
    const missingSections = requiredSections.filter(section => !hasSection(content, section));
    
    if (missingSections.length > 0) {
      results.messages.push({
        type: 'error',
        message: `Missing required sections: ${missingSections.join(', ')}`
      });
      results.valid = false;
    }
  }
  
  // Document-specific validations
  if (docType === 'prd') {
    results.messages.push(...validateRequirements(content));
  } else if (docType === 'api') {
    results.messages.push(...validateApiEndpoints(content));
  }
  
  // Common validations
  results.messages.push(...validateMermaidDiagrams(content));
  results.messages.push(...validateFileReferences(content, filePath));
  
  // Update validity based on errors
  if (results.messages.some(msg => msg.type === 'error')) {
    results.valid = false;
  }
  
  return results;
}

/**
 * Formats and prints validation results
 * @param {Object} results - The validation results
 */
function printResults(results) {
  console.log(chalk.bold(`\nFile: ${results.filePath}`));
  console.log(chalk.gray(`Document Type: ${results.docType}`));
  console.log(chalk.gray(`Valid: ${results.valid ? chalk.green('✓') : chalk.red('✗')}`));
  
  if (results.messages.length === 0) {
    console.log(chalk.green('No issues found!'));
    return;
  }
  
  console.log('\nMessages:');
  results.messages.forEach(msg => {
    let prefix;
    switch (msg.type) {
      case 'error':
        prefix = chalk.red('ERROR');
        break;
      case 'warning':
        prefix = chalk.yellow('WARNING');
        break;
      case 'info':
        prefix = chalk.blue('INFO');
        break;
      default:
        prefix = chalk.gray('NOTE');
    }
    console.log(`  ${prefix}: ${msg.message}`);
  });
}

/**
 * Main function to validate documents
 * @param {Array} patterns - Glob patterns to match files for validation
 */
function main(patterns) {
  if (!patterns || patterns.length === 0) {
    patterns = ['docs/**/*.md', 'README.md', 'CHANGELOG.md'];
  }
  
  let files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern);
    files = [...files, ...matches];
  });
  
  console.log(chalk.bold(`Validating ${files.length} documentation files...\n`));
  
  let validCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  
  files.forEach(file => {
    const results = validateDocument(file);
    printResults(results);
    
    if (results.valid) {
      validCount++;
    }
    
    errorCount += results.messages.filter(msg => msg.type === 'error').length;
    warningCount += results.messages.filter(msg => msg.type === 'warning').length;
  });
  
  console.log(chalk.bold('\nSummary:'));
  console.log(`  Files validated: ${files.length}`);
  console.log(`  Valid files: ${chalk.green(validCount)}`);
  console.log(`  Invalid files: ${chalk.red(files.length - validCount)}`);
  console.log(`  Total errors: ${chalk.red(errorCount)}`);
  console.log(`  Total warnings: ${chalk.yellow(warningCount)}`);
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run the validator
const args = process.argv.slice(2);
main(args); 