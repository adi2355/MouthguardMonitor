/**
 * Canova Database Refactoring - Hooks Migration Script
 * 
 * This script helps update React hooks that use database services,
 * replacing them with hooks that use the consolidated DatabaseManager.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const patterns = [
  'src/hooks/**/*.ts',
  'src/hooks/**/*.tsx',
  'app/hooks/**/*.ts',
  'app/hooks/**/*.tsx'
];

// Search for hooks that import services
function findHooksFiles() {
  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, { cwd: rootDir });
    files.push(...matches.map(match => path.join(rootDir, match)));
  });
  return files;
}

// Check if a file contains service imports
function containsServiceImports(content) {
  const serviceImports = [
    /import.*DataService/,
    /import.*StrainService/,
    /import.*AsyncStorageManager/,
    /import.*ExpoSQLiteManager/
  ];
  
  return serviceImports.some(pattern => pattern.test(content));
}

// Analyze hooks file and provide guidance for migration
function analyzeHookFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!containsServiceImports(content)) {
      return {
        file: filePath,
        needsMigration: false,
        message: 'No database service imports found'
      };
    }
    
    // Identify service usage patterns
    const usesDataService = /DataService/.test(content);
    const usesStrainService = /StrainService/.test(content);
    const usesAsyncStorageManager = /AsyncStorageManager/.test(content);
    const usesExpoSQLiteManager = /ExpoSQLiteManager/.test(content);
    
    // Build migration guidance
    const services = [];
    if (usesDataService) services.push('DataService');
    if (usesStrainService) services.push('StrainService');
    if (usesAsyncStorageManager) services.push('AsyncStorageManager');
    if (usesExpoSQLiteManager) services.push('ExpoSQLiteManager');
    
    return {
      file: filePath,
      needsMigration: true,
      services,
      message: `Contains imports for: ${services.join(', ')}`
    };
  } catch (error) {
    return {
      file: filePath,
      needsMigration: false,
      error: error.message
    };
  }
}

// Generate migration guidance for all hooks
function generateMigrationGuidance() {
  console.log('Analyzing hooks files for migration...\n');
  
  const files = findHooksFiles();
  console.log(`Found ${files.length} hooks files to analyze\n`);
  
  const results = files.map(analyzeHookFile);
  const needsMigration = results.filter(r => r.needsMigration);
  
  console.log('=== Hooks Migration Report ===\n');
  console.log(`Total hooks files: ${files.length}`);
  console.log(`Files needing migration: ${needsMigration.length}\n`);
  
  if (needsMigration.length > 0) {
    console.log('Files that need migration:\n');
    
    needsMigration.forEach(({ file, services, message }) => {
      const relativePath = path.relative(rootDir, file);
      console.log(`- ${relativePath}`);
      console.log(`  Services: ${services.join(', ')}`);
      console.log('  Migration steps:');
      console.log('  1. Replace service imports with DatabaseManager import');
      console.log('  2. Update service method calls to use DatabaseManager');
      console.log('  3. Update any state or return values to match new method signatures\n');
    });
    
    console.log('=== Example Migration ===\n');
    console.log('Before:');
    console.log('```typescript');
    console.log('import { StrainService } from "../services/StrainService";');
    console.log('');
    console.log('export function useStrains() {');
    console.log('  // ...hook implementation');
    console.log('  const loadStrains = async () => {');
    console.log('    const strainService = StrainService.getInstance();');
    console.log('    const strains = await strainService.getPopularStrains();');
    console.log('    // ...rest of implementation');
    console.log('  };');
    console.log('  // ...rest of hook');
    console.log('}');
    console.log('```\n');
    
    console.log('After:');
    console.log('```typescript');
    console.log('import { databaseManager } from "../DatabaseManager";');
    console.log('');
    console.log('export function useStrains() {');
    console.log('  // ...hook implementation');
    console.log('  const loadStrains = async () => {');
    console.log('    const strains = await databaseManager.getPopularStrains();');
    console.log('    // ...rest of implementation');
    console.log('  };');
    console.log('  // ...rest of hook');
    console.log('}');
    console.log('```');
  } else {
    console.log('No hooks found that need migration!');
  }
}

// Run the analysis
generateMigrationGuidance(); 