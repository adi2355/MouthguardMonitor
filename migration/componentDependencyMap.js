/**
 * Canova Database Refactoring - Component Dependency Map Generator
 * 
 * This script analyzes components and their dependencies on database services
 * to help guide the migration process in the correct order.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const patterns = [
  'src/components/**/*.tsx',
  'app/**/*.tsx',
  'components/**/*.tsx'
];

// Services to analyze
const services = [
  'DataService',
  'StrainService',
  'AsyncStorageManager',
  'ExpoSQLiteManager'
];

// Find all component files
function findComponentFiles() {
  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, { cwd: rootDir });
    files.push(...matches.map(match => path.join(rootDir, match)));
  });
  return files;
}

// Analyze a component file for service dependencies
function analyzeComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(rootDir, filePath);
    
    // Extract component name from file path
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Check for service dependencies
    const dependencies = {};
    services.forEach(service => {
      const regex = new RegExp(`import.*${service}.*from|${service}\\.getInstance\\(\\)|${service.charAt(0).toLowerCase() + service.slice(1)}\\.`);
      dependencies[service] = regex.test(content);
    });
    
    // Check for imports from other components (simplified)
    const importedComponents = [];
    const importRegex = /import\s+.*?\s+from\s+['"]\.\.\/components\/([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      importedComponents.push(match[1]);
    }
    
    // Calculate complexity based on number of dependencies
    const dependencyCount = Object.values(dependencies).filter(Boolean).length;
    const complexity = dependencyCount === 0 ? 'Low' : dependencyCount === 1 ? 'Medium' : 'High';
    
    return {
      name: fileName,
      path: relativePath,
      dependencies,
      hasDependencies: dependencyCount > 0,
      importedComponents,
      complexity
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
    return null;
  }
}

// Generate a dependency map for all components
function generateDependencyMap() {
  console.log('Analyzing component dependencies...\n');
  
  const files = findComponentFiles();
  console.log(`Found ${files.length} component files to analyze\n`);
  
  const components = files.map(analyzeComponent).filter(Boolean);
  
  // Group components by dependency status
  const withDependencies = components.filter(c => c.hasDependencies);
  const noDependencies = components.filter(c => !c.hasDependencies);
  
  // Sort components by complexity (simple to complex)
  const sortedComponents = [...withDependencies].sort((a, b) => {
    const complexityScore = {
      'Low': 1,
      'Medium': 2,
      'High': 3
    };
    
    const aDeps = Object.values(a.dependencies).filter(Boolean).length;
    const bDeps = Object.values(b.dependencies).filter(Boolean).length;
    
    return aDeps - bDeps;
  });
  
  // Generate report
  console.log('=== Component Dependency Map ===\n');
  console.log(`Total components: ${components.length}`);
  console.log(`Components with database dependencies: ${withDependencies.length}`);
  console.log(`Components without database dependencies: ${noDependencies.length}\n`);
  
  console.log('=== Migration Priority List ===\n');
  console.log('Components to migrate (in recommended order):\n');
  
  sortedComponents.forEach((component, index) => {
    const deps = Object.entries(component.dependencies)
      .filter(([_, hasIt]) => hasIt)
      .map(([service]) => service);
    
    console.log(`${index + 1}. ${component.name} (Complexity: ${component.complexity})`);
    console.log(`   Path: ${component.path}`);
    console.log(`   Services: ${deps.join(', ')}`);
    console.log('');
  });
  
  console.log('=== Service Usage Statistics ===\n');
  
  services.forEach(service => {
    const count = withDependencies.filter(c => c.dependencies[service]).length;
    const percentage = ((count / components.length) * 100).toFixed(1);
    console.log(`${service}: Used in ${count} components (${percentage}%)`);
  });
  
  return {
    components,
    withDependencies,
    noDependencies,
    sortedComponents
  };
}

// Run the analysis
generateDependencyMap(); 