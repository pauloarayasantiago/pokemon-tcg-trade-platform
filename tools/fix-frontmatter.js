const fs = require('fs');
const path = require('path');

/**
 * @function fixFrontmatter
 * @description Fixes frontmatter delimiters in documentation files
 * @param {string} filePath - Path to the file to fix
 */
function fixFrontmatter(filePath) {
  console.log(`Fixing frontmatter in ${filePath}...`);
  
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`File content starts with: "${content.substring(0, 20).replace(/\n/g, '\\n')}..."`);
    
    // Check if the file already has frontmatter - handle both with and without newline after ---
    if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
      console.log('Found opening frontmatter delimiter');
      
      // Find the closing delimiter - try multiple formats
      const delimiterFormats = ['\n---\n', '\r\n---\r\n', '\n---\r\n', '\r\n---\n'];
      let endIndex = -1;
      
      for (const format of delimiterFormats) {
        const idx = content.indexOf(format, 3);
        if (idx !== -1) {
          endIndex = idx;
          console.log(`Found closing delimiter with format "${format.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}" at index ${endIndex}`);
          break;
        }
      }
      
      if (endIndex === -1) {
        // Try to find the first heading after frontmatter
        const headingIndex = content.search(/\n#\s/);
        console.log(`Heading index: ${headingIndex}`);
        
        if (headingIndex !== -1) {
          // Extract frontmatter content
          const frontmatter = content.substring(0, headingIndex).trim();
          const restOfContent = content.substring(headingIndex);
          
          // Create the fixed content with proper delimiters
          const fixedContent = `${frontmatter}\n---\n${restOfContent}`;
          
          // Write the fixed content back to the file
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`✅ Fixed missing closing frontmatter delimiter in ${filePath}`);
          return true;
        }
      } else {
        console.log(`✓ ${filePath} already has proper frontmatter delimiters`);
        return false;
      }
    } else {
      // Try to manually fix the file
      const updatedContent = manuallyFixFile(filePath, content);
      if (updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Manually fixed frontmatter in ${filePath}`);
        return true;
      }
      
      console.log(`✗ ${filePath} does not start with frontmatter and could not be fixed automatically`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing frontmatter in ${filePath}:`, error);
    return false;
  }
  
  return false;
}

/**
 * Handle specific file formats that need manual fixing
 */
function manuallyFixFile(filePath, content) {
  // Handle specific known file patterns
  if (filePath.includes('/api/cards-api.md')) {
    const titleMatch = content.match(/title: "([^"]+)"/);
    if (titleMatch) {
      console.log('Found API cards file with title, attempting to fix');
      
      // Find the first heading
      const headingMatch = content.match(/\n# .+\n/);
      if (headingMatch) {
        const headingIndex = content.indexOf(headingMatch[0]);
        if (headingIndex > 0) {
          // Split content at the heading
          const frontmatterText = content.substring(0, headingIndex);
          const bodyText = content.substring(headingIndex);
          
          // Ensure frontmatter has proper closing delimiter
          const fixedFrontmatter = frontmatterText.trim().endsWith('---') 
            ? frontmatterText 
            : `${frontmatterText.trim()}\n---`;
            
          return `${fixedFrontmatter}\n${bodyText}`;
        }
      }
    }
  } else if (filePath.includes('/components/card-browser.md')) {
    // Similar pattern for component files
    const componentMatch = content.match(/component_name: "([^"]+)"/);
    if (componentMatch) {
      console.log('Found component file, attempting to fix');
      
      // Find the first heading
      const headingMatch = content.match(/\n# .+\n/);
      if (headingMatch) {
        const headingIndex = content.indexOf(headingMatch[0]);
        if (headingIndex > 0) {
          // Split content at the heading
          const frontmatterText = content.substring(0, headingIndex);
          const bodyText = content.substring(headingIndex);
          
          // Ensure frontmatter has proper closing delimiter
          const fixedFrontmatter = frontmatterText.trim().endsWith('---') 
            ? frontmatterText 
            : `${frontmatterText.trim()}\n---`;
            
          return `${fixedFrontmatter}\n${bodyText}`;
        }
      }
    }
  }
  
  return null;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node fix-frontmatter.js [file_path]');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} does not exist`);
    process.exit(1);
  }
  
  const fixed = fixFrontmatter(filePath);
  
  if (fixed) {
    console.log('Frontmatter fixed successfully');
  } else {
    console.log('No changes made to frontmatter');
  }
}

main(); 