const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const SOURCE_DIR = path.join(__dirname, '..', 'src');

// Track statistics
let stats = {
  totalFiles: 0,
  filesUpdated: 0,
  referencesFixed: 0,
  referencesRemoved: 0,
  errors: []
};

// Find all source files
const sourceFiles = glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: SOURCE_DIR });
const sourceFileSet = new Set(sourceFiles.map(f => path.join('src', f)));

// Find all documentation files
const docFiles = glob.sync('**/*.md', { cwd: DOCS_DIR });
const docFileSet = new Set(docFiles.map(f => path.join('docs', f)));

// Function to check if a file exists or has a planned location
function validateFileReference(filePath) {
  // Check if file exists
  if (sourceFileSet.has(filePath) || docFileSet.has(filePath)) {
    return { valid: true, exists: true };
  }

  // Check if it's a planned file based on project structure
  const isPlannedFile = 
    filePath.startsWith('src/app/') ||
    filePath.startsWith('src/components/') ||
    filePath.startsWith('src/lib/') ||
    filePath.startsWith('src/tests/') ||
    filePath.startsWith('docs/');

  return { valid: isPlannedFile, exists: false };
}

// Function to fix file references in a document
function fixFileReferences(filePath) {
  stats.totalFiles++;
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let hasChanges = false;

  // Find all file references
  const fileRefRegex = /`([^`]+\.[a-zA-Z]+)`/g;
  const matches = [...content.matchAll(fileRefRegex)];

  for (const match of matches) {
    const [fullMatch, filePath] = match;
    const { valid, exists } = validateFileReference(filePath);

    if (!valid) {
      // Remove invalid reference
      updatedContent = updatedContent.replace(fullMatch, '`[removed-invalid-reference]`');
      stats.referencesRemoved++;
      hasChanges = true;
      stats.errors.push({
        file: filePath,
        error: `Removed invalid reference: ${filePath}`
      });
    } else if (!exists) {
      // Add comment for planned files
      const comment = exists ? '' : ' (planned)';
      updatedContent = updatedContent.replace(fullMatch, `\`${filePath}\`${comment}`);
      stats.referencesFixed++;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, updatedContent);
    stats.filesUpdated++;
  }
}

// Process each documentation file
docFiles.forEach(file => {
  const filePath = path.join(DOCS_DIR, file);
  fixFileReferences(filePath);
});

// Print results
console.log('\nFile Reference Fix Results:');
console.log('---------------------------');
console.log(`Total Files Processed: ${stats.totalFiles}`);
console.log(`Files Updated: ${stats.filesUpdated}`);
console.log(`References Fixed: ${stats.referencesFixed}`);
console.log(`Invalid References Removed: ${stats.referencesRemoved}`);

if (stats.errors.length > 0) {
  console.log('\nErrors:');
  stats.errors.forEach(({ file, error }) => {
    console.log(`- ${file}: ${error}`);
  });
}

// Exit with error if there were any invalid references removed
process.exit(stats.referencesRemoved > 0 ? 1 : 0); 