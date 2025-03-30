import { DatabaseManager } from '../DatabaseManager';
import { StorageService } from './StorageService';
import { StrainsRepository } from '../repositories/StrainsRepository';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { BONG_HITS_DATABASE_NAME } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = 'hasLaunched';

/**
 * Service for handling app setup and first launch
 */
export class AppSetupService {
  private storageService: StorageService;
  private databaseManager: DatabaseManager;
  private strainsRepository: StrainsRepository;
  private achievementsRepository: AchievementsRepository | null = null;

  /**
   * Constructor
   * @param storageService Storage service for checking first launch
   * @param databaseManager Database manager for initialization
   * @param strainsRepository Repository for seeding initial data
   */
  constructor(
    storageService: StorageService,
    databaseManager: DatabaseManager,
    strainsRepository: StrainsRepository
  ) {
    this.storageService = storageService;
    this.databaseManager = databaseManager;
    this.strainsRepository = strainsRepository;
  }

  /**
   * Check if this is the first app launch
   */
  public async isFirstLaunch(): Promise<boolean> {
    try {
      console.log(`[AppSetupService] Checking if key '${FIRST_LAUNCH_KEY}' exists...`);
      const hasLaunched = await this.storageService.hasKey(FIRST_LAUNCH_KEY);
      console.log(`[AppSetupService] Key '${FIRST_LAUNCH_KEY}' exists: ${hasLaunched}. Is first launch? ${!hasLaunched}`);
      return !hasLaunched; // Return true if key does NOT exist
    } catch (error) {
      console.error('[AppSetupService] Error checking first launch flag:', error);
      // Default to assuming it's NOT the first launch on error to prevent re-initialization loops
      return false;
    }
  }

  /**
   * Initialize the app for first launch
   */
  public async initializeOnFirstLaunch(): Promise<void> {
    // CRITICAL: Mark first launch EARLY to prevent repeated initializations
    // We do this OUTSIDE the try/catch to ensure it happens regardless of other errors
    let flagSet = false;
    
    try {
      console.log(`[AppSetupService] Setting '${FIRST_LAUNCH_KEY}' to true in AsyncStorage FIRST...`);
      const value = JSON.stringify(true);
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, value);
      
      // Verify the value was written correctly
      const verifyValue = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      if (verifyValue === value) {
        console.log(`[AppSetupService] Successfully set and verified '${FIRST_LAUNCH_KEY}' with direct AsyncStorage call.`);
        flagSet = true;
      } else {
        console.error(`[AppSetupService] Failed to verify '${FIRST_LAUNCH_KEY}', value mismatch! Got: ${verifyValue}`);
      }
    } catch (flagError) {
      console.error(`[AppSetupService] Error setting '${FIRST_LAUNCH_KEY}' flag:`, flagError);
    }
    
    try {
      console.log('[AppSetupService] Initializing app for first launch sequence...');
      
      // Initialize database (runs migrations)
      console.log('[AppSetupService] Starting database initialization and migration...');
      await this.databaseManager.initialize();
      console.log('[AppSetupService] Database initialization and migration completed.');
      
      // Seed initial strain data
      console.log('[AppSetupService] Starting strain data initialization...');
      try {
        await this.strainsRepository.initializeData();
        console.log('[AppSetupService] Strain data initialization completed successfully.');
      } catch (strainError) {
        console.error('[AppSetupService] Error during strain data initialization:', strainError);
        throw strainError; // Re-throw after logging
      }
      
      // Create achievements repository and seed achievement data
      console.log('[AppSetupService] Getting database for achievements...');
      const db = await this.databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
      console.log('[AppSetupService] Creating achievements repository...');
      this.achievementsRepository = new AchievementsRepository(db);
      
      console.log('[AppSetupService] Starting achievements data initialization...');
      try {
        await this.achievementsRepository.initializeData();
        console.log('[AppSetupService] Achievements data initialization completed successfully.');
      } catch (achievementError) {
        console.error('[AppSetupService] Error during achievement data initialization:', achievementError);
        throw achievementError; // Re-throw after logging
      }
      
      // Mark first launch as completed AGAIN for redundancy
      if (!flagSet) {
        console.log(`[AppSetupService] Setting '${FIRST_LAUNCH_KEY}' to true again via StorageService...`);
        await this.storageService.setValue(FIRST_LAUNCH_KEY, true);
        console.log(`[AppSetupService] Successfully set '${FIRST_LAUNCH_KEY}' via StorageService.`);
      }
      
      console.log('[AppSetupService] First launch initialization sequence completed.');
    } catch (error) {
      console.error('[AppSetupService] Error during first launch initialization:', error);
      
      // If we haven't set the flag yet, make one last attempt
      if (!flagSet) {
        try {
          console.log(`[AppSetupService] Setting '${FIRST_LAUNCH_KEY}' to true after error...`);
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, JSON.stringify(true));
          console.log(`[AppSetupService] Set '${FIRST_LAUNCH_KEY}' after error.`);
        } catch (flagError) {
          console.error(`[AppSetupService] Failed to set '${FIRST_LAUNCH_KEY}' after error:`, flagError);
        }
      }
      
      throw error; // Re-throw to indicate failure
    }
  }

  /**
   * Ensure achievements data is initialized regardless of first launch status
   */
  public async ensureAchievementsInitialized(): Promise<void> {
    try {
      console.log('[AppSetupService] Ensuring achievements are initialized...');
      if (!this.achievementsRepository) {
        console.log('[AppSetupService] Creating achievements repository...');
        const db = await this.databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
        this.achievementsRepository = new AchievementsRepository(db);
      }

      // Check if achievements exist before initializing
      try {
        const achievementsExist = await this.achievementsRepository.achievementsExist();
        if (!achievementsExist) {
          console.log('[AppSetupService] No achievements found, initializing achievements data...');
          await this.achievementsRepository.initializeData();
        } else {
          console.log('[AppSetupService] Achievements data already exists, skipping initialization.');
        }
      } catch (error) {
        // If the check fails (e.g., table doesn't exist yet), initialize anyway
        console.warn('[AppSetupService] Error checking if achievements exist, attempting initialization anyway:', error);
        await this.achievementsRepository.initializeData();
      }
    } catch (error) {
      console.error('[AppSetupService] Error ensuring achievements initialized:', error);
      throw error;
    }
  }

  /**
   * Ensure app is initialized regardless of whether it's first launch
   */
  public async ensureInitialized(): Promise<void> {
    console.log('[AppSetupService] Starting ensureInitialized...');
    try {
      // Check if this is first launch
      const isFirst = await this.isFirstLaunch();
      console.log(`[AppSetupService] isFirstLaunch result: ${isFirst}`);
      
      if (isFirst) {
        console.log('[AppSetupService] Detected first launch, running full initialization...');
        try {
          // If first launch, run full initialization
          await this.initializeOnFirstLaunch();
        } catch (initError) {
          console.error('[AppSetupService] Full initialization failed, attempting simple flag set:', initError);
          
          // If full initialization fails, at least set the flag to prevent repeat attempts
          try {
            // Direct AsyncStorage call as fallback
            const value = JSON.stringify(true);
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, value);
            console.log(`[AppSetupService] Set '${FIRST_LAUNCH_KEY}' flag as fallback after initialization error`);
            
            // Try minimal database initialization
            await this.databaseManager.ensureInitialized();
            console.log('[AppSetupService] Minimal database initialization completed as fallback');
          } catch (flagError) {
            console.error('[AppSetupService] Even fallback flag setting failed:', flagError);
            // If everything fails, we'll have to try again next launch
          }
          
          // Rethrow to inform caller of the issue
          throw initError;
        }
      } else {
        console.log('[AppSetupService] Not first launch, ensuring database and achievements are initialized...');
        // Otherwise just ensure database is initialized
        await this.databaseManager.ensureInitialized();
        
        // Also ensure achievements are initialized
        await this.ensureAchievementsInitialized();
        console.log('[AppSetupService] Database and achievements checked/initialized.');
      }
      console.log('[AppSetupService] ensureInitialized completed.');
    } catch (error) {
      console.error('[AppSetupService] Error during ensureInitialized:', error);
      throw error; // Re-throw to indicate failure
    }
  }

  /**
   * Reset app to first launch state (for testing)
   */
  public async resetToFirstLaunch(): Promise<void> {
    try {
      console.warn('[AppSetupService] Resetting app to first launch state...');
      // Remove first launch marker
      await this.storageService.removeValue(FIRST_LAUNCH_KEY);
      console.log(`[AppSetupService] Removed key '${FIRST_LAUNCH_KEY}'.`);
      
      // Clean up database connections
      await this.databaseManager.cleanup();
      
      console.log('[AppSetupService] App reset successfully completed.');
    } catch (error) {
      console.error('[AppSetupService] Error resetting to first launch:', error);
      throw error; // Re-throw to indicate failure
    }
  }

  /**
   * Tests AsyncStorage operations with direct API calls
   * This helps determine if AsyncStorage is functioning correctly
   */
  public async testAsyncStorage(): Promise<boolean> {
    try {
      const testKey = 'asyncStorageTest';
      const testValue = {test: true, timestamp: new Date().toISOString()};
      
      console.log(`[AppSetupService] DIRECT AsyncStorage Test: Attempting to write key '${testKey}'`);
      
      // Direct write with AsyncStorage
      const jsonValue = JSON.stringify(testValue);
      await AsyncStorage.setItem(testKey, jsonValue);
      
      // Verify by reading back
      const readValue = await AsyncStorage.getItem(testKey);
      
      // Clean up
      await AsyncStorage.removeItem(testKey);
      
      if (readValue === jsonValue) {
        console.log(`[AppSetupService] DIRECT AsyncStorage Test: SUCCESS - value was correctly stored and retrieved`);
        return true;
      } else {
        console.error(`[AppSetupService] DIRECT AsyncStorage Test: FAILURE - value mismatch`);
        console.log(`  Expected: ${jsonValue}`);
        console.log(`  Received: ${readValue}`);
        return false;
      }
    } catch (error) {
      console.error('[AppSetupService] DIRECT AsyncStorage Test: ERROR', error);
      return false;
    }
  }
} 