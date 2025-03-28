import { DatabaseManager } from '../DatabaseManager';
import { StorageService } from './StorageService';
import { StrainsRepository } from '../repositories/StrainsRepository';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { BONG_HITS_DATABASE_NAME } from '../constants';

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
      
      // Seed initial strain data
      await this.strainsRepository.initializeData();
      
      // Create achievements repository and seed achievement data
      const db = await this.databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
      this.achievementsRepository = new AchievementsRepository(db);
      await this.achievementsRepository.initializeData();
      
      // Mark first launch as completed
      await this.storageService.setValue(FIRST_LAUNCH_KEY, true);
      
      console.log('[AppSetupService] First launch initialization completed.');
    } catch (error) {
      console.error('[AppSetupService] Error initializing app on first launch:', error);
      throw error;
    }
  }

  /**
   * Ensure achievements data is initialized regardless of first launch status
   */
  public async ensureAchievementsInitialized(): Promise<void> {
    try {
      if (!this.achievementsRepository) {
        const db = await this.databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
        this.achievementsRepository = new AchievementsRepository(db);
      }
      
      await this.achievementsRepository.initializeData();
    } catch (error) {
      console.error('[AppSetupService] Error ensuring achievements initialized:', error);
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
        
        // Also ensure achievements are initialized
        await this.ensureAchievementsInitialized();
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