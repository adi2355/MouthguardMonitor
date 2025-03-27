# Canova Database Refactoring Guide - Simplified Approach

## Overview

This guide proposes a simplified database architecture for the Canova app that addresses the previous issues while minimizing complexity. The key issues we're solving include:

- Multiple competing database initializations
- Inconsistent patterns
- Dangerous DROP TABLE statements causing data loss
- SQL injection vulnerabilities
- Lack of migration strategy
- Redundant code across services
- Timestamp issues with test data

## Simplified Architecture

### 1. One Central Manager

The `DatabaseManager` class (at `src/DatabaseManager.ts`) should be the only class responsible for all database operations:

- Direct access to all databases (SQLite and AsyncStorage)
- Handles all database initialization and migrations
- Provides all necessary database methods
- Eliminates the need for multiple managers and services

```typescript
// Example of direct DatabaseManager usage
import { databaseManager } from "@/src/DatabaseManager";

// In a component
const weeklyStats = await databaseManager.getWeeklyStats();
const strains = await databaseManager.searchStrains("blue dream");
const savedDevices = await databaseManager.getSavedDevices();
```

### 2. Direct Access Pattern

Components should access the DatabaseManager directly:

- No intermediary service or manager classes
- Simpler imports and fewer dependencies
- Clearer data flow through the application
- Easier to trace and debug database operations

```typescript
// Clean, direct access in React components
import { databaseManager } from "@/src/DatabaseManager";
import { useState, useEffect } from 'react';

function WeeklyStatsComponent() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await databaseManager.getWeeklyStats();
      setStats(data);
      setLoading(false);
    }
    loadData();
  }, []);
  
  // Render component...
}
```

### 3. Clean Migration

Instead of maintaining parallel implementations:

- Fully migrate to the new system
- Remove old services (DataService, StrainService, etc.)
- Update all components to use the DatabaseManager directly
- Delete unnecessary abstraction layers

## Migration Support

The simplified architecture still includes proper versioning and migration support:

- Current database version is tracked in AsyncStorage
- Migrations are applied incrementally and only when needed
- Each migration is implemented as a separate method
- No more destructive DROP TABLE statements

```typescript
// Migration support in DatabaseManager
private async applyMigration(version: number): Promise<void> {
  switch (version) {
    case 1:
      await this.migrationV1();
      break;
    case 2:
      await this.migrationV2();
      break;
    default:
      console.warn(`[DatabaseManager] No migration found for version ${version}`);
  }
}
```

## Transition Strategy

To transition to this simplified architecture:

1. **Phase 1**: Update the DatabaseManager to include all necessary methods from the various services
2. **Phase 2**: Update components one by one to use DatabaseManager directly
3. **Phase 3**: Delete the deprecated service classes once no components use them

## Security Improvements

The simplified architecture still includes:

- Parameterized queries to prevent SQL injection
- Proper error handling and logging
- Validation of inputs before database operations

## Best Practices for Using the Simplified Architecture

1. **Always use the DatabaseManager directly** for all database operations
2. **Use transactions** for operations that need to be atomic
3. **Add proper error handling** when calling database methods
4. For **new database tables**, add them to the appropriate migration method
5. **Keep the DatabaseManager focused** - don't add non-database logic

## Testing and Validation

To verify the implementation:

1. Create unit tests for the DatabaseManager methods
2. Create integration tests for database operations
3. Use the DbValidator tool to check database integrity

```typescript
// Example of testing the implementation
import { validateDatabase } from "@/src/database/dbValidator";

// Run the validation and get results
const validationResults = await validateDatabase();
console.log("Validation successful:", validationResults.success);
``` 