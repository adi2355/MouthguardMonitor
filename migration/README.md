# Canova Database Refactoring Migration Guide

This folder contains the necessary scripts and documentation for migrating from the old multi-service database architecture to the new consolidated DatabaseManager approach.

## Migration Overview

The migration follows these main steps:
1. Consolidate functionality into a single DatabaseManager
2. Update component imports and method calls using semi-automated scripts
3. Test each component to ensure proper functionality
4. Remove deprecated service files once all components are migrated

## Getting Started

Before starting the migration process, make sure you're working on a clean branch:

```bash
git checkout -b database-refactoring-migration
```

## Available Migration Tools

Several scripts are available to help with the migration process:

### 1. Component Dependency Map

Generate a map of component dependencies to guide your migration order:

```bash
node migration/componentDependencyMap.js
```

This will output:
- A prioritized list of components to migrate
- Complexity ratings for each component
- Usage statistics for each service

### 2. Migration Script

The main migration script automates the process of updating imports and method calls:

```bash
node migration/migration_script.js
```

The script will:
- Search for database service imports and replace them with DatabaseManager imports
- Replace service method calls with direct DatabaseManager calls
- Log all changes made for review

### 3. Hooks Migration Analysis

Analyze React hooks that need to be migrated:

```bash
node migration/updateHooks.js
```

This script:
- Identifies all hooks that use database services
- Provides guidance on how to update each hook
- Shows examples of before/after migration patterns

### 4. Migration Verification

Verify that the migration is complete:

```bash
node migration/verifyMigration.js
```

This check ensures:
- No remaining service imports in any files
- All deprecated service files have been removed
- Migration is 100% complete

## Migration Process

### Phase 1: Preparation & Analysis

1. Run the component dependency map generator to plan your migration order:
   ```bash
   node migration/componentDependencyMap.js
   ```

2. Prioritize components based on complexity and importance

### Phase 2: Component Migration

1. Run the automated migration script:
   ```bash
   node migration/migration_script.js
   ```

2. For each component:
   - Test the component after migration
   - Fix any issues manually
   - Verify functionality matches pre-migration behavior

### Phase 3: Hooks Migration

1. Identify hooks that need migration:
   ```bash
   node migration/updateHooks.js
   ```

2. Update each hook using the guidance provided
3. Test affected components

### Phase 4: Verification & Cleanup

1. Verify the migration is complete:
   ```bash
   node migration/verifyMigration.js
   ```

2. Remove deprecated service files if the verification passes
3. Run the verification again to confirm removal

## Example Migration

Before:
```typescript
import { StrainService } from '../services/StrainService';

// In component
const strainService = StrainService.getInstance();
const strains = await strainService.getPopularStrains(5);
```

After:
```typescript
import { databaseManager } from '../DatabaseManager';

// In component
const strains = await databaseManager.getPopularStrains(5);
```

## Troubleshooting

If you encounter issues during migration:

1. Check the console for error messages
2. Verify that all required methods are implemented in DatabaseManager
3. Look for type mismatches between services and DatabaseManager
4. Ensure all asynchronous calls are properly awaited

## Rollback Plan

If critical issues arise during migration:

1. Revert to the pre-migration branch
2. Restore any deleted service files
3. Report the issue with specific details in the project management tool

## Questions?

If you have questions about the migration process, contact the project lead or refer to the full refactoring guide. 