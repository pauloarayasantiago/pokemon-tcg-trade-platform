#!/usr/bin/env node

/**
 * Simple Documentation Internationalization (i18n) Extractor
 * 
 * This tool extracts content from markdown documentation files 
 * for translation purposes.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Get command line arguments
const [,, sourcePath, langCode = 'es'] = process.argv;

if (!sourcePath) {
  console.error('Usage: node i18n-extract.js <source-file> [language-code]');
  process.exit(1);
}

// Constants
const TRANSLATIONS_DIR = './translations';

// Main function
async function extractDocumentContent() {
  try {
    console.log(`Extracting content from: ${sourcePath}`);
    
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: Source file ${sourcePath} does not exist`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(TRANSLATIONS_DIR, langCode);
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read source file
    const content = fs.readFileSync(sourcePath, 'utf8');
    console.log(`File read successfully: ${sourcePath}`);
    
    // Parse frontmatter and content
    const { data: frontmatter, content: markdownContent } = matter(content);
    console.log(`Frontmatter parsed successfully`);

    // Create translation template
    const templateData = {
      original: {
        file: sourcePath,
        frontmatter,
      },
      translation: {
        title: frontmatter.title || '',
        description: frontmatter.description || '',
        content: markdownContent.trim(),
      },
    };

    // Create output filename based on source
    const sourceName = path.basename(sourcePath, path.extname(sourcePath));
    const outputPath = path.join(outputDir, `${sourceName}.json`);
    console.log(`Writing to output file: ${outputPath}`);
    
    // Write translation template
    fs.writeFileSync(
      outputPath,
      JSON.stringify(templateData, null, 2),
      'utf8'
    );

    console.log(`Translation template created: ${outputPath}`);
  } catch (error) {
    console.error(`Error extracting content: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute the main function
extractDocumentContent(); 