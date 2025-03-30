import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseManager, databaseManager } from '../DatabaseManager';
import { BongHitsRepository } from '../repositories/BongHitsRepository';
import { StrainsRepository } from '../repositories/StrainsRepository';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';
import { BluetoothService } from '../services/BluetoothService';
import { AppSetupService } from '../services/AppSetupService';
import { BONG_HITS_DATABASE_NAME } from '../constants';
import { BluetoothHandler } from '../contexts/BluetoothContext';

// Define the AppContext type
interface AppContextType {
  databaseManager: DatabaseManager;
  bongHitsRepository: BongHitsRepository;
  strainsRepository: StrainsRepository;
  storageService: StorageService;
  deviceService: DeviceService;
  bluetoothService: BluetoothService;
  appSetupService: AppSetupService;
  initialized: boolean;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | null>(null);

// Define the provider props
interface AppProviderProps {
  children: ReactNode;
  bluetoothHandler?: BluetoothHandler; // Optional existing bluetoothHandler
}

/**
 * AppProvider component that initializes all services and repositories
 * and provides them via React Context
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children, bluetoothHandler }) => {
  const [initialized, setInitialized] = useState(false);
  const [services, setServices] = useState<AppContextType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackgroundLaunch, setIsBackgroundLaunch] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is starting in background (iOS only)
    if (Platform.OS === 'ios' && AppState.currentState !== 'active') {
      console.log('[AppProvider] App appears to be starting in background mode');
      setIsBackgroundLaunch(true);
    }

    // Direct AsyncStorage test
    const testAsyncStorage = async () => {
      try {
        const testKey = 'asyncStorageTestKey';
        const testValue = `test-${Date.now()}`;
        console.log(`[AppProvider] AsyncStorage Test: Setting ${testKey} to ${testValue}`);
        await AsyncStorage.setItem(testKey, testValue);
        console.log(`[AppProvider] AsyncStorage Test: Set completed. Now getting ${testKey}`);
        const retrievedValue = await AsyncStorage.getItem(testKey);
        console.log(`[AppProvider] AsyncStorage Test: Retrieved value: ${retrievedValue}`);
        if (retrievedValue === testValue) {
          console.log('[AppProvider] AsyncStorage Test: SUCCESS - Value matched!');
        } else {
          console.error('[AppProvider] AsyncStorage Test: FAILURE - Value mismatch!');
        }
        // Clean up
        await AsyncStorage.removeItem(testKey);
      } catch (e) {
        console.error('[AppProvider] AsyncStorage Test: FAILED with error:', e);
      }
    };
    // Run the test
    testAsyncStorage();

    async function setupApp() {
      try {
        console.log('[AppProvider] Setting up app dependencies...');
        
        // Use singleton database manager instance
        const storageService = new StorageService();

        // Run direct AsyncStorage test early to verify functionality
        console.log('[AppProvider] Will run direct AsyncStorage test first...');
        
        // Initialize minimal services for the test
        const minimalAppSetupService = new AppSetupService(
          storageService,
          databaseManager,
          new StrainsRepository(await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME))
        );
        
        // Run AsyncStorage test
        const storageTestResult = await minimalAppSetupService.testAsyncStorage();
        console.log(`[AppProvider] Direct AsyncStorage test result: ${storageTestResult ? 'SUCCESS' : 'FAILURE'}`);
        
        // Check if hasLaunched flag exists
        const hasLaunchedKey = 'hasLaunched';
        const hasLaunchedRaw = await AsyncStorage.getItem(hasLaunchedKey);
        console.log(`[AppProvider] Current 'hasLaunched' value: ${hasLaunchedRaw}`);
        
        // Initialize database connections
        await databaseManager.initialize();
        
        // Use a single database connection for all repositories
        const db = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
        
        // Initialize repositories with the same database connection
        const bongHitsRepository = new BongHitsRepository(db);
        const strainsRepository = new StrainsRepository(db);
        
        // Initialize services that depend on repositories
        const deviceService = new DeviceService(storageService);
        
        // Prioritize Bluetooth service creation for background mode
        const bluetoothService = new BluetoothService(
          deviceService,
          bongHitsRepository,
          bluetoothHandler
        );

        // In background mode, we prioritize getting the Bluetooth service ready
        // and defer other non-critical initializations
        if (isBackgroundLaunch) {
          console.log('[AppProvider] Background launch detected, prioritizing Bluetooth service initialization');
          
          // Create minimal appSetupService to avoid null references
          const minimalAppSetupService = new AppSetupService(
            storageService,
            databaseManager,
            strainsRepository
          );
          
          // Set core services needed for Bluetooth background operation
          setServices({
            databaseManager,
            bongHitsRepository,
            strainsRepository,
            storageService,
            deviceService,
            bluetoothService,
            appSetupService: minimalAppSetupService, // Use minimal instead of null
            initialized: true
          });
          
          setInitialized(true);
          console.log('[AppProvider] Core services initialized for background operation');
          
          // Listen for app coming to foreground to complete remaining setup
          const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
              console.log('[AppProvider] App came to foreground, completing full initialization');
              // Complete remaining setup when app comes to foreground
              completeSetup(storageService, databaseManager, strainsRepository, bluetoothService);
              // Remove listener once we've handled the transition
              subscription.remove();
            }
          });
        } else {
          // Normal foreground launch - complete full setup immediately
          const appSetupService = new AppSetupService(
            storageService,
            databaseManager,
            strainsRepository
          );
          
          // Check if this is first launch and perform setup if needed
          await appSetupService.ensureInitialized();
          
          // Set all services in state for context
          setServices({
            databaseManager,
            bongHitsRepository,
            strainsRepository,
            storageService,
            deviceService,
            bluetoothService,
            appSetupService,
            initialized: true
          });
          
          setInitialized(true);
          console.log('[AppProvider] App dependencies setup complete');
        }
      } catch (err: any) {
        console.error('[AppProvider] Error setting up app:', err);
        setError(err.message || 'Failed to initialize app');
      }
    }
    
    // Helper function to complete setup when app comes to foreground
    async function completeSetup(
      storageService: StorageService,
      databaseManager: DatabaseManager,
      strainsRepository: StrainsRepository,
      bluetoothService: BluetoothService
    ) {
      try {
        const appSetupService = new AppSetupService(
          storageService,
          databaseManager,
          strainsRepository
        );
        
        // Ensure app is properly initialized
        await appSetupService.ensureInitialized();
        
        // Update services with the appSetupService
        setServices(prevServices => {
          if (!prevServices) return null;
          return {
            ...prevServices,
            appSetupService
          };
        });
        
        console.log('[AppProvider] Deferred initialization completed successfully');
      } catch (err: any) {
        console.error('[AppProvider] Error during deferred initialization:', err);
      }
    }
    
    setupApp();
    
    // Cleanup function
    return () => {
      // Close database connections when app is unmounted
      if (services?.databaseManager) {
        services.databaseManager.cleanup().catch(err => {
          console.error('[AppProvider] Error cleaning up database connections:', err);
        });
      }
    };
  }, [bluetoothHandler]);

  // Loading state - don't show this in background mode
  if ((!initialized || !services) && !isBackgroundLaunch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00e676" />
        <Text style={{ marginTop: 20, color: '#fff' }}>Initializing app...</Text>
      </View>
    );
  }

  // Error state - don't show this in background mode
  if (error && !isBackgroundLaunch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff4444', fontSize: 16, marginBottom: 10 }}>
          Error
        </Text>
        <Text style={{ color: '#fff', textAlign: 'center', paddingHorizontal: 20 }}>
          {error}
        </Text>
      </View>
    );
  }

  // In background mode with uninitialized services, render nothing
  if (isBackgroundLaunch && !services) {
    console.log('[AppProvider] Background mode still initializing, rendering nothing');
    return null;
  }

  // Render children with context
  return (
    <AppContext.Provider value={services as AppContextType}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use the app context
 * @returns AppContextType The app context
 * @throws Error if used outside of AppProvider
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Custom hook to get the BongHitsRepository
 * @returns BongHitsRepository The repository for bong hits data
 */
export function useBongHitsRepository(): BongHitsRepository {
  const { bongHitsRepository } = useAppContext();
  return bongHitsRepository;
}

/**
 * Custom hook to get the StrainsRepository
 * @returns StrainsRepository The repository for strains data
 */
export function useStrainsRepository(): StrainsRepository {
  const { strainsRepository } = useAppContext();
  return strainsRepository;
}

/**
 * Custom hook to get the StorageService
 * @returns StorageService The service for async storage operations
 */
export function useStorageService(): StorageService {
  const { storageService } = useAppContext();
  return storageService;
}

/**
 * Custom hook to get the DeviceService
 * @returns DeviceService The service for device management
 */
export function useDeviceService(): DeviceService {
  const { deviceService } = useAppContext();
  return deviceService;
}

/**
 * Custom hook to get the BluetoothService
 * @returns BluetoothService The service for Bluetooth operations
 */
export function useBluetoothService(): BluetoothService {
  const { bluetoothService } = useAppContext();
  return bluetoothService;
}

/**
 * Custom hook to get the AppSetupService
 * @returns AppSetupService The service for app setup
 */
export function useAppSetupService(): AppSetupService {
  const { appSetupService } = useAppContext();
  return appSetupService;
} 