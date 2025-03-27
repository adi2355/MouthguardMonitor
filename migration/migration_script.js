/**
 * Canova Database Refactoring Migration Script
 * 
 * This script helps migrate components from using individual service files
 * to the consolidated DatabaseManager. It searches for service imports and
 * replaces them with DatabaseManager imports.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'app/**/*.ts',
  'app/**/*.tsx',
  'components/**/*.ts',
  'components/**/*.tsx'
];

// Old import patterns to replace
const oldImportPatterns = [
  {
    pattern: /import .*\{ DataService \}.*from ['"]([^'"]*)['"]/g,
    newImport: (match, importPath) => {
      // Convert relative path to path to DatabaseManager
      return `import { databaseManager } from "../DatabaseManager"`;
    }
  },
  {
    pattern: /import .*\{ StrainService \}.*from ['"]([^'"]*)['"]/g,
    newImport: (match, importPath) => {
      return `import { databaseManager } from "../DatabaseManager"`;
    }
  },
  {
    pattern: /import .*\{ AsyncStorageManager \}.*from ['"]([^'"]*)['"]/g,
    newImport: (match, importPath) => {
      return `import { databaseManager } from "../DatabaseManager"`;
    }
  }
];

// Method call patterns to replace
const methodReplacements = [
  // DataService
  { pattern: /DataService\.getInstance\(\)/g, replacement: 'databaseManager' },
  { pattern: /dataService\.([a-zA-Z0-9_]+)\(/g, replacement: 'databaseManager.$1(' },
  
  // StrainService
  { pattern: /StrainService\.getInstance\(\)/g, replacement: 'databaseManager' },
  { pattern: /strainService\.([a-zA-Z0-9_]+)\(/g, replacement: 'databaseManager.$1(' },
  { pattern: /StrainService\.([a-zA-Z0-9_]+)\(/g, replacement: 'databaseManager.$1(' },
  
  // AsyncStorageManager
  { pattern: /AsyncStorageManager\.getInstance\(\)/g, replacement: 'databaseManager' },
  { pattern: /asyncStorageManager\.([a-zA-Z0-9_]+)\(/g, replacement: 'databaseManager.$1(' }
];

// Find all files matching the patterns
function findFiles() {
  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, { cwd: rootDir });
    files.push(...matches.map(match => path.join(rootDir, match)));
  });
  return files;
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports
    oldImportPatterns.forEach(({ pattern, newImport }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match, importPath) => {
          modified = true;
          return newImport(match, importPath);
        });
      }
    });
    
    // Replace method calls
    methodReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    // If modifications were made, save the file
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Modified: ${filePath}`);
      return true;
    } else {
      console.log(`  No changes needed in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  Error processing ${filePath}: ${error}`);
    return false;
  }
}

// Main function to run the migration
function runMigration() {
  console.log('Starting database refactoring migration...');
  
  const files = findFiles();
  console.log(`Found ${files.length} files to process`);
  
  let modifiedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      modifiedCount++;
    }
  });
  
  console.log('Migration complete!');
  console.log(`Modified ${modifiedCount} files out of ${files.length} total files`);
}

// Run the migration
runMigration(); 