/**
 * Canova Database Refactoring - Migration Verification Script
 * 
 * This script verifies that the migration was successful by checking
 * for any remaining service imports or instances.
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

// Files that should no longer exist after migration
const deprecatedFiles = [
  'src/services/DataService.ts',
  'src/services/StrainService.ts',
  'src/database/asyncStorageManager.ts',
  'src/database/expoSQLiteManager.ts'
];

// Patterns to search for in files
const importPatterns = [
  {
    name: 'DataService',
    pattern: /import.*DataService(?!.*useDataService).*from/
  },
  {
    name: 'StrainService', 
    pattern: /import.*StrainService.*from/
  },
  {
    name: 'AsyncStorageManager',
    pattern: /import.*AsyncStorageManager.*from/
  },
  {
    name: 'ExpoSQLiteManager',
    pattern: /import.*ExpoSQLiteManager.*from/
  }
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

// Check if deprecated files still exist
function checkDeprecatedFiles() {
  const existingFiles = [];
  deprecatedFiles.forEach(filePath => {
    const fullPath = path.join(rootDir, filePath);
    if (fs.existsSync(fullPath)) {
      existingFiles.push(filePath);
    }
  });
  return existingFiles;
}

// Check a file for service imports
function checkFileForImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const foundImports = [];
    
    importPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(content)) {
        foundImports.push(name);
      }
    });
    
    if (foundImports.length > 0) {
      return {
        file: filePath,
        imports: foundImports
      };
    }
    return null;
  } catch (error) {
    console.error(`Error checking file ${filePath}: ${error.message}`);
    return null;
  }
}

// Run the verification
function verifyMigration() {
  console.log('=== Canova Database Migration Verification ===\n');
  
  // Check for deprecated files
  console.log('Checking for deprecated files...');
  const existingDeprecatedFiles = checkDeprecatedFiles();
  
  if (existingDeprecatedFiles.length > 0) {
    console.log('\n⚠️  WARNING: The following deprecated files still exist:');
    existingDeprecatedFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    console.log('\nThese files should be removed to complete the migration.');
  } else {
    console.log('✅ All deprecated files have been removed.');
  }
  
  // Check for service imports
  console.log('\nChecking for remaining service imports...');
  const files = findFiles();
  console.log(`Scanning ${files.length} files...`);
  
  const filesWithImports = [];
  files.forEach(file => {
    const result = checkFileForImports(file);
    if (result) {
      filesWithImports.push(result);
    }
  });
  
  if (filesWithImports.length > 0) {
    console.log('\n⚠️  WARNING: The following files still contain service imports:');
    filesWithImports.forEach(({ file, imports }) => {
      const relativePath = path.relative(rootDir, file);
      console.log(`  - ${relativePath}`);
      console.log(`    Services: ${imports.join(', ')}`);
    });
    console.log('\nThese imports should be updated to use DatabaseManager.');
    
    // Generate summary
    const total = filesWithImports.length;
    const percentage = ((total / files.length) * 100).toFixed(1);
    console.log(`\nMigration progress: ${files.length - total}/${files.length} files (${100 - percentage}% complete)`);
  } else {
    console.log('✅ No remaining service imports found in any files.');
    console.log('\nMigration progress: 100% complete');
  }
  
  // Final summary
  console.log('\n=== Migration Verification Summary ===');
  
  if (existingDeprecatedFiles.length === 0 && filesWithImports.length === 0) {
    console.log('\n✅ Migration successfully completed! All services have been consolidated into DatabaseManager.');
  } else {
    console.log('\n⚠️  Migration incomplete. Please address the issues listed above to complete the migration.');
  }
}

// Run the verification
verifyMigration(); 