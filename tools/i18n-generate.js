#!/usr/bin/env node

/**
 * Simple Documentation Internationalization (i18n) Generator
 * 
 * This tool generates translated markdown files from JSON translation files.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Get command line arguments
const [,, translationPath, langCode = 'es'] = process.argv;

if (!translationPath) {
  console.error('Usage: node i18n-generate.js <translation-file> [language-code]');
  process.exit(1);
}

// Constants
const OUTPUT_DIR = `./i18n/${langCode}`;

// Main function
async function generateTranslatedDocument() {
  try {
    console.log(`Generating translated document from: ${translationPath}`);
    
    // Check if translation file exists
    if (!fs.existsSync(translationPath)) {
      console.error(`Error: Translation file ${translationPath} does not exist`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      console.log(`Creating directory: ${OUTPUT_DIR}`);
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read translation file
    const translationData = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    console.log(`Translation data read successfully`);
    console.log(`Title: ${translationData.translation.title}`);
    console.log(`Description: ${translationData.translation.description}`);
    
    // Extract original file path and read it to get the structure
    const originalFilePath = translationData.original.file;
    console.log(`Original file path: ${originalFilePath}`);
    
    if (!fs.existsSync(originalFilePath)) {
      console.error(`Error: Original file ${originalFilePath} referenced in translation doesn't exist`);
      process.exit(1);
    }
    
    const originalContent = fs.readFileSync(originalFilePath, 'utf8');
    console.log(`Original file read successfully`);
    
    const originalFrontmatter = matter(originalContent).data;
    console.log(`Original frontmatter parsed: ${JSON.stringify(originalFrontmatter, null, 2)}`);
    
    // Create translated frontmatter
    const translatedFrontmatter = {
      ...originalFrontmatter,
      title: translationData.translation.title,
      description: translationData.translation.description,
      language: langCode,
      original_file: originalFilePath,
      translated: true,
      translation_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };
    console.log(`Translated frontmatter created: ${JSON.stringify(translatedFrontmatter, null, 2)}`);

    // Create translated content
    const translatedContent = matter.stringify(
      translationData.translation.content,
      translatedFrontmatter
    );
    console.log(`Translated content created (length: ${translatedContent.length} chars)`);

    // Create output filename based on original
    const sourceName = path.basename(originalFilePath);
    const outputPath = path.join(OUTPUT_DIR, sourceName);
    console.log(`Writing to output file: ${outputPath}`);
    
    // Write translated file
    fs.writeFileSync(outputPath, translatedContent, 'utf8');

    console.log(`Translated document created: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating translated document: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute the main function
generateTranslatedDocument(); 