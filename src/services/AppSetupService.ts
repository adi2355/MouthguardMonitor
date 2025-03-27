import { DatabaseManager } from '../DatabaseManager';
import { StorageService } from './StorageService';
import { StrainsRepository } from '../repositories/StrainsRepository';

const FIRST_LAUNCH_KEY = 'hasLaunched';

/**
 * Service for handling app setup and first launch
 */
export class AppSetupService {
  private storageService: StorageService;
  private databaseManager: DatabaseManager;
  private strainsRepository: StrainsRepository;

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
      return !(await this.storageService.hasKey(FIRST_LAUNCH_KEY));
    } catch (error) {
      console.error('[AppSetupService] Error checking first launch:', error);
      return false;
    }
  }

  /**
   * Initialize the app for first launch
   */
  public async initializeOnFirstLaunch(): Promise<void> {
    try {
      console.log('[AppSetupService] Initializing app for first launch...');
      
      // Initialize database (runs migrations)
      await this.databaseManager.initialize();
      
      // Seed initial data
      await this.strainsRepository.initializeData();
      
      // Mark first launch as completed
      await this.storageService.setValue(FIRST_LAUNCH_KEY, true);
      
      console.log('[AppSetupService] First launch initialization completed.');
    } catch (error) {
      console.error('[AppSetupService] Error initializing app on first launch:', error);
      throw error;
    }
  }

  /**
   * Ensure app is initialized regardless of whether it's first launch
   */
  public async ensureInitialized(): Promise<void> {
    try {
      // Check if this is first launch
      const isFirstLaunch = await this.isFirstLaunch();
      
      if (isFirstLaunch) {
        // If first launch, run full initialization
        await this.initializeOnFirstLaunch();
      } else {
        // Otherwise just ensure database is initialized
        await this.databaseManager.ensureInitialized();
      }
    } catch (error) {
      console.error('[AppSetupService] Error ensuring app is initialized:', error);
      throw error;
    }
  }

  /**
   * Reset app to first launch state (for testing)
   */
  public async resetToFirstLaunch(): Promise<void> {
    try {
      // Remove first launch marker
      await this.storageService.removeValue(FIRST_LAUNCH_KEY);
      
      // Clean up database connections
      await this.databaseManager.cleanup();
      
      console.log('[AppSetupService] App reset to first launch state.');
    } catch (error) {
      console.error('[AppSetupService] Error resetting to first launch:', error);
      throw error;
    }
  }
} 