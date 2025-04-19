// File: src/DatabaseManager.ts
// Refactored DatabaseManager that focuses on database connection management and migrations.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { migrations } from "./migrations";
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Export constants for use by other modules
export const DB_VERSION_KEY = "dbVersion";
export const CURRENT_DB_VERSION = 3;
export const MOUTHGUARD_DB_NAME = "mouthguardMonitor.db";

/**
 * DatabaseManager: Handles database connections and migrations
 */
export class DatabaseManager {
  private databaseConnections: Map<string, SQLiteDatabase> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private static instance: DatabaseManager;
  private instanceId: number; // Add unique ID for debugging

  /**
   * Get the singleton instance of DatabaseManager
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      console.log('[DatabaseManager getInstance] Creating FIRST instance...');
      DatabaseManager.instance = new DatabaseManager();
    } else {
      // Log the ID of the existing instance being returned
      console.log(`[DatabaseManager getInstance] Returning EXISTING instance ID: ${DatabaseManager.instance.instanceId}`);
    }
    return DatabaseManager.instance;
  }

  /**
   * Constructor for DatabaseManager
   */
  public constructor() {
    this.instanceId = Math.random(); // Assign unique ID
    console.log(`[DatabaseManager CONSTRUCTOR] New instance created with ID: ${this.instanceId}`);
  }

  /**
   * Initializes all databases and manages migrations
   */
  public async initialize(options: { forceCleanup?: boolean, forceRun?: boolean } = {}): Promise<void> {
    // If forced cleanup is requested, close existing connections first
    if (options.forceCleanup) {
      await this.cleanup();
      this.initialized = false; // Reset initialized state after cleanup
    }

    // If already initialized, return immediately unless forceRun is true
    if (this.initialized && !options.forceRun) {
      return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    console.info('[DatabaseManager] Initializing databases...');
    
    // Create a promise for initialization
    this.initializationPromise = this.doInitialize(options.forceRun).finally(() => {
      this.initializationPromise = null;
    });
    
    return this.initializationPromise;
  }

  /**
   * Internal method to perform actual initialization logic
   */
  private async doInitialize(forceRun: boolean = false): Promise<void> {
    try {
      console.log('[DatabaseManager] Starting database initialization...');
      
      // Get current DB version
      const storedVersion = parseInt(await AsyncStorage.getItem(DB_VERSION_KEY) || '0');
      console.log(`[DatabaseManager] Current stored database version: ${storedVersion}, Latest version: ${CURRENT_DB_VERSION}`);
      
      // Check if we need to update/initialize
      if (storedVersion < CURRENT_DB_VERSION || forceRun) {
        // First open the database connection directly without using getDatabase
        // to avoid circular dependencies
        let dbName = MOUTHGUARD_DB_NAME;
        // Ensure dbName has .db extension
        if (!dbName.endsWith('.db')) {
          dbName = `${dbName}.db`;
        }
        console.log(`[DatabaseManager] Opening database for migrations directly: ${dbName}`);
        const db = await openDatabaseAsync(dbName);
        console.log(`[DatabaseManager] Database connection obtained for migrations`);
        
        // Store the connection
        this.databaseConnections.set(dbName, db);
        
        // Run migrations
        await this.runMigrations(forceRun ? 0 : storedVersion, db);
      } else {
        // Open main database through normal path
        await this.getDatabase(MOUTHGUARD_DB_NAME);
      }
      
      this.initialized = true;
      console.log('[DatabaseManager] Database initialization complete');
    } catch (error) {
      console.error('[DatabaseManager] Initialization error', error);
      throw error;
    }
  }

  /**
   * Run database migrations from current version to latest
   */
  private async runMigrations(currentVersion: number, db: SQLiteDatabase): Promise<void> {
    console.log(`[DatabaseManager] Running migrations from version ${currentVersion} to ${CURRENT_DB_VERSION}`);

    // Apply sequential migrations
    for (let ver = currentVersion + 1; ver <= CURRENT_DB_VERSION; ver++) {
      console.log(`[DatabaseManager] Applying migration to version ${ver}`);
      const migration = migrations[ver];
      
      if (!migration) {
        console.warn(`[DatabaseManager] Migration for version ${ver} not found`);
        continue;
      }
      
      console.log(`[DatabaseManager] Starting migration for version ${ver}`);
      try {
        // Execute migration directly
        await migration.up(db);
        console.log(`[DatabaseManager] Migration to version ${ver} succeeded`);
      } catch (error) {
        console.error(`[DatabaseManager] Migration to version ${ver} failed:`, error);
        throw error;
      }
    }
    
    // Update stored version in AsyncStorage
    console.log(`[DatabaseManager] Updating stored DB version to ${CURRENT_DB_VERSION}`);
    await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
    console.log(`[DatabaseManager] Migrations complete. Current version: ${CURRENT_DB_VERSION}`);
  }

  /**
   * Ensure database manager is initialized
   */
  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get a database connection by name
   */
  public async getDatabase(dbName: string): Promise<SQLiteDatabase> {
    // Ensure consistent naming with .db extension
    if (!dbName.endsWith('.db')) {
      dbName = `${dbName}.db`;
      console.log(`[DatabaseManager getDatabase] Added .db extension to ensure consistency: ${dbName}`);
    }
  
    // Check if we already have a connection
    if (this.databaseConnections.has(dbName)) {
      const existingDb = this.databaseConnections.get(dbName)!;
      console.log(`[DatabaseManager getDatabase] Returning existing connection for ${dbName} from instance ID: ${this.instanceId}`);
      return existingDb;
    }
    
    console.log(`[DatabaseManager getDatabase] Opening database: ${dbName} from instance ID: ${this.instanceId}`);
    
    try {
      // Open database connection
      const db = await openDatabaseAsync(dbName);
      console.log(`[DatabaseManager getDatabase] Opened NEW connection for ${dbName} from instance ID: ${this.instanceId}`);
      
      // Store connection
      this.databaseConnections.set(dbName, db);
      
      return db;
    } catch (error) {
      console.error(`[DatabaseManager] Error opening database ${dbName}:`, error);
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  public async cleanup(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    console.log('[DatabaseManager] Cleaning up database connections');
    
    // Close each connection - convert Map.entries() to Array first to fix iterator issues
    const connections = Array.from(this.databaseConnections.entries());
    for (const [name, db] of connections) {
      console.log(`[DatabaseManager] Closing database: ${name}`);
      promises.push(db.closeAsync());
    }
    
    // Wait for all connections to close
    await Promise.all(promises);
    
    // Clear connection map
    this.databaseConnections.clear();
  }

  /**
   * Reset database by removing all data
   */
  public async resetDatabase(): Promise<void> {
    try {
      console.log('[DatabaseManager] Resetting database...');
      
      // First close all connections
      await this.cleanup();
      
      // Clear version from AsyncStorage
      await AsyncStorage.removeItem(DB_VERSION_KEY);
      
      // On iOS, we can delete the database files directly
      if (Platform.OS === 'ios') {
        const databaseDir = `${FileSystem.documentDirectory}SQLite`;
        const entries = await FileSystem.readDirectoryAsync(databaseDir);
        
        for (const entry of entries) {
          if (entry.endsWith('.db') || entry.endsWith('-journal') || entry.endsWith('-wal') || entry.endsWith('-shm')) {
            await FileSystem.deleteAsync(`${databaseDir}/${entry}`, { idempotent: true });
          }
        }
      }
      
      // Re-initialize databases
      this.initialized = false;
      await this.initialize();
      
      console.log('[DatabaseManager] Database reset complete');
    } catch (error) {
      console.error('[DatabaseManager] Error resetting database:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const databaseManager = DatabaseManager.getInstance(); 