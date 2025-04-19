import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseManager } from '../DatabaseManager';
import { StorageService } from './StorageService';
import { AthleteRepository } from '../repositories/AthleteRepository';
import { SensorDataRepository } from '../repositories/SensorDataRepository';

/**
 * Service for handling app setup/initialization tasks
 */
export class AppSetupService {
  private storageService: StorageService;
  private databaseManager: DatabaseManager;
  
  /**
   * Constructor
   * @param storageService Injected storage service
   * @param databaseManager Injected database manager
   */
  constructor(
    storageService: StorageService,
    databaseManager: DatabaseManager
  ) {
    this.storageService = storageService;
    this.databaseManager = databaseManager;
  }
  
  /**
   * Test AsyncStorage operation by setting and getting a value
   * @returns Promise that resolves with true if test passed, false otherwise
   */
  public async testAsyncStorage(): Promise<boolean> {
    try {
      const testKey = 'asyncStorageTestValue';
      const testValue = `test-${Date.now()}`;
      
      // Set the test value
      await AsyncStorage.setItem(testKey, testValue);
      
      // Get the test value
      const retrieved = await AsyncStorage.getItem(testKey);
      
      // Clean up
      await AsyncStorage.removeItem(testKey);
      
      // Check if test passed
      return retrieved === testValue;
    } catch (error) {
      console.error('[AppSetupService] AsyncStorage test failed:', error);
      return false;
    }
  }
  
  /**
   * Check if this is the first launch and initialize if needed
   */
  public async ensureInitialized(): Promise<void> {
    const hasLaunchedKey = 'hasLaunched';
    
    try {
      const hasLaunched = await this.storageService.getValue<boolean>(hasLaunchedKey);
      
      // Always initialize database to ensure tables exist
      console.log('[AppSetupService] Initializing database...');
      await this.databaseManager.initialize({ forceRun: true });
      
      if (!hasLaunched) {
        console.log('[AppSetupService] First launch detected, performing initialization...');
        
        // Call the first-time setup method
        await this.performFirstTimeSetup();
      } else {
        console.log('[AppSetupService] Not first launch, skipping first-time setup');
      }
    } catch (error) {
      console.error('[AppSetupService] Error during initialization:', error);
      throw error;
    }
  }
  
  /**
   * Reset the app to "first launch" state
   * Warning: This will clear all data
   */
  public async resetAppState(): Promise<void> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Reset database
      await this.databaseManager.resetDatabase();
      
      console.log('[AppSetupService] App state reset complete');
    } catch (error) {
      console.error('[AppSetupService] Error resetting app state:', error);
      throw error;
    }
  }
  
  /**
   * Perform first-time initialization tasks
   */
  private async performFirstTimeSetup(): Promise<void> {
    try {
      console.log('[AppSetupService] Performing first-time initialization...');
      
      // Get database connection
      const db = await this.databaseManager.getDatabase('mouthguardMonitor');
      
      // Create repositories
      const athleteRepository = new AthleteRepository(db);
      const sensorDataRepository = new SensorDataRepository(db);
      
      // Create sample data for testing
      await this.createSampleData(athleteRepository);
      
      // Mark initialization as complete
      await AsyncStorage.setItem('hasLaunched', 'true');
      
      console.log('[AppSetupService] First-time initialization complete');
    } catch (error) {
      console.error('[AppSetupService] First-time initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Create sample data for testing
   */
  private async createSampleData(athleteRepository: AthleteRepository): Promise<void> {
    try {
      console.log('[AppSetupService] Creating sample athletes for testing...');
      
      // Add some test athletes
      const sampleAthletes = [
        {
          name: 'John Doe',
          team: 'Blue Team',
          position: 'Forward',
          age: 19,
          height: '6\'2"',
          weight: '185 lbs',
          deviceId: undefined,
          notes: 'Sample athlete 1',
          number: '23',
          active: true
        },
        {
          name: 'Jane Smith',
          team: 'Red Team',
          position: 'Defense',
          age: 20,
          height: '5\'9"',
          weight: '165 lbs',
          deviceId: undefined,
          notes: 'Sample athlete 2',
          number: '45',
          active: true
        }
      ];
      
      // Add each athlete
      for (const athlete of sampleAthletes) {
        console.log(`[AppSetupService] Adding sample athlete: ${athlete.name}`);
        await athleteRepository.addAthlete(athlete);
      }
      
      console.log('[AppSetupService] Sample data creation complete');
    } catch (error) {
      console.error('[AppSetupService] Error creating sample data:', error);
      // Don't throw error here - we don't want to fail initialization because of sample data
      console.log('[AppSetupService] Continuing initialization despite sample data error');
    }
  }
} 