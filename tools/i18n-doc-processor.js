#!/usr/bin/env node

/**
 * Documentation Internationalization (i18n) Processor
 * 
 * This tool helps manage multilingual documentation by:
 * 1. Extracting content from source documentation files
 * 2. Creating translation templates
 * 3. Generating translated documentation
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { program } = require('commander');

// Configure CLI options
program
  .name('i18n-doc-processor')
  .description('Tools for managing multilingual documentation')
  .version('1.0.0');

program
  .command('extract <source>')
  .description('Extract content from source documentation for translation')
  .option('-o, --output <dir>', 'Output directory for translation template', './translations')
  .option('-l, --lang <code>', 'Target language code', 'en')
  .action(extractContent);

program
  .command('generate <source> <translations>')
  .description('Generate translated documentation from source and translations')
  .option('-o, --output <dir>', 'Output directory for translated docs', './i18n')
  .option('-l, --lang <code>', 'Language code for output files', 'es')
  .action(generateTranslatedDocs);

program
  .command('list-missing')
  .description('List documents missing translations')
  .option('-s, --source <dir>', 'Source documentation directory', './docs')
  .option('-t, --translations <dir>', 'Translations directory', './translations')
  .option('-l, --langs <codes>', 'Comma-separated language codes to check', 'es,fr,de,ja')
  .action(listMissingTranslations);

program.parse();

/**
 * Extracts content from a source documentation file for translation
 */
function extractContent(source, options) {
  try {
    console.log(`Extracting content from: ${source}`);
    
    // Check if source file exists
    if (!fs.existsSync(source)) {
      console.error(`Error: Source file ${source} does not exist`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(options.output, options.lang);
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read source file
    const content = fs.readFileSync(source, 'utf8');
    console.log(`File read successfully: ${source}`);
    
    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);
    console.log(`Frontmatter parsed: ${Object.keys(frontmatter).join(', ')}`);

    // Create translation template
    const templateData = {
      original: {
        file: source,
        frontmatter,
      },
      translation: {
        title: frontmatter.title || '',
        description: frontmatter.description || '',
        content: markdownContent.trim(),
      },
    };

    // Create output filename based on source
    const sourceName = path.basename(source, path.extname(source));
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

/**
 * Generates translated documentation from source and translations
 */
function generateTranslatedDocs(source, translationsFile, options) {
  try {
    // Check if source and translations exist
    if (!fs.existsSync(source)) {
      console.error(`Error: Source file ${source} does not exist`);
      process.exit(1);
    }
    
    if (!fs.existsSync(translationsFile)) {
      console.error(`Error: Translations file ${translationsFile} does not exist`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(options.output, options.lang);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read source file and translations
    const sourceContent = fs.readFileSync(source, 'utf8');
    const { data: sourceFrontmatter } = matter(sourceContent);
    
    const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

    // Create translated frontmatter
    const translatedFrontmatter = {
      ...sourceFrontmatter,
      title: translations.translation.title,
      description: translations.translation.description,
      language: options.lang,
      original_file: source,
    };

    // Create translated content
    const translatedContent = matter.stringify(
      translations.translation.content,
      translatedFrontmatter
    );

    // Create output filename based on source
    const sourceName = path.basename(source, path.extname(source));
    const outputPath = path.join(outputDir, `${sourceName}${path.extname(source)}`);
    
    // Write translated file
    fs.writeFileSync(outputPath, translatedContent, 'utf8');

    console.log(`Translated document created: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating translated docs: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Lists documents missing translations
 */
function listMissingTranslations(options) {
  try {
    const sourceDir = options.source;
    const translationsDir = options.translations;
    const languages = options.langs.split(',');
    
    if (!fs.existsSync(sourceDir)) {
      console.error(`Error: Source directory ${sourceDir} does not exist`);
      process.exit(1);
    }

    // Get all markdown files in source directory
    const sourceFiles = getAllMarkdownFiles(sourceDir);
    
    console.log(`Checking translations for ${sourceFiles.length} source files in ${languages.length} languages...`);
    console.log('-----------------------------------------------------------');
    
    // Check each language
    languages.forEach(lang => {
      const langTranslationsDir = path.join(translationsDir, lang);
      const missingTranslations = [];
      
      sourceFiles.forEach(sourceFile => {
        const relativePath = path.relative(sourceDir, sourceFile);
        const baseName = path.basename(sourceFile, path.extname(sourceFile));
        const translationFile = path.join(langTranslationsDir, `${baseName}.json`);
        
        if (!fs.existsSync(translationFile)) {
          missingTranslations.push(relativePath);
        }
      });
      
      console.log(`Language: ${lang}`);
      console.log(`Missing translations: ${missingTranslations.length}/${sourceFiles.length}`);
      if (missingTranslations.length > 0) {
        console.log('Files missing translations:');
        missingTranslations.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
      console.log('-----------------------------------------------------------');
    });
  } catch (error) {
    console.error(`Error listing missing translations: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Recursively gets all markdown files in a directory
 */
function getAllMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
} 