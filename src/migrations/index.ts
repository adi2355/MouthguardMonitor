// src/migrations/index.ts
// Registry for all migrations to enable static imports

import * as v1 from './v1';
// Import future migration versions here
// import * as v2 from './v2';
// import * as v3 from './v3';

/**
 * Migration module interface
 */
export interface MigrationModule {
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}

/**
 * Migrations registry
 * Maps version numbers to migration modules
 */
export const migrations: Record<number, MigrationModule> = {
  1: v1,
  // Add future migrations here as they are created
  // 2: v2,
  // 3: v3,
}; 