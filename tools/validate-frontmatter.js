const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');

const DOCS_DIR = path.join(process.cwd(), 'docs');

// Required frontmatter fields
const REQUIRED_FIELDS = [
  'title',
  'version',
  'last_updated',
  'status',
  'has_mermaid'
];

// Valid status values
const VALID_STATUS = [
  'draft',
  'in_review',
  'published',
  'Active'
];

function validateFrontmatter() {
  console.log('Validating frontmatter...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', { cwd: DOCS_DIR });
  let totalFiles = 0;
  let validFiles = 0;
  let errors = [];

  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push(`${file}: Missing frontmatter`);
      return;
    }

    try {
      const frontmatter = yaml.load(frontmatterMatch[1]);

      // Check required fields
      REQUIRED_FIELDS.forEach(field => {
        if (!(field in frontmatter)) {
          errors.push(`${file}: Missing required field "${field}"`);
        }
      });

      // Validate status
      if (frontmatter.status && !VALID_STATUS.includes(frontmatter.status)) {
        errors.push(`${file}: Invalid status "${frontmatter.status}". Must be one of: ${VALID_STATUS.join(', ')}`);
      }

      // Validate version format
      if (frontmatter.version && !/^\d+\.\d+\.\d+$/.test(frontmatter.version)) {
        errors.push(`${file}: Invalid version format "${frontmatter.version}". Must be in format: x.y.z`);
      }

      // Validate date format
      if (frontmatter.last_updated && !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.last_updated)) {
        errors.push(`${file}: Invalid date format "${frontmatter.last_updated}". Must be in format: YYYY-MM-DD`);
      }

      // Validate has_mermaid is boolean
      if (frontmatter.has_mermaid !== undefined && typeof frontmatter.has_mermaid !== 'boolean') {
        errors.push(`${file}: has_mermaid must be a boolean value`);
      }

      validFiles++;
    } catch (error) {
      errors.push(`${file}: Invalid YAML frontmatter: ${error.message}`);
    }
  });

  // Print results
  console.log('\nFrontmatter Validation Results:');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Valid files: ${validFiles}`);
  console.log(`Invalid files: ${totalFiles - validFiles}`);
  console.log(`Validation rate: ${((validFiles / totalFiles) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('\nAll frontmatter is valid!');
}

validateFrontmatter(); 