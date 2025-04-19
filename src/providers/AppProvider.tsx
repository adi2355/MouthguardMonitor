import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseManager, databaseManager } from '../DatabaseManager';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';
import { BluetoothService } from '../services/BluetoothService';
import { AppSetupService } from '../services/AppSetupService';
import { AthleteRepository } from '../repositories/AthleteRepository';
import { SensorDataRepository } from '../repositories/SensorDataRepository';
import { BluetoothHandler } from '../contexts/BluetoothContext';

// Define the AppContext type
interface AppContextType {
  databaseManager: DatabaseManager;
  storageService: StorageService;
  deviceService: DeviceService;
  bluetoothService: BluetoothService;
  appSetupService: AppSetupService;
  athleteRepository: AthleteRepository;
  sensorDataRepository: SensorDataRepository;
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
        
        // Check if hasLaunched flag exists
        const hasLaunchedKey = 'hasLaunched';
        const hasLaunchedRaw = await AsyncStorage.getItem(hasLaunchedKey);
        console.log(`[AppProvider] Current 'hasLaunched' value: ${hasLaunchedRaw}`);
        
        // Initialize database connections
        console.log('[AppProvider] BEFORE databaseManager.initialize()');
        await databaseManager.initialize();
        console.log('[AppProvider] AFTER databaseManager.initialize()');
        
        // Use a single database connection for all repositories
        console.log('[AppProvider] BEFORE getDatabase for mouthguardMonitor');
        const db = await databaseManager.getDatabase('mouthguardMonitor');
        console.log('[AppProvider] AFTER getDatabase for mouthguardMonitor');
        
        // Initialize repositories with the database connection
        console.log('[AppProvider] Initializing repositories...');
        const athleteRepository = new AthleteRepository(db);
        const sensorDataRepository = new SensorDataRepository(db);
        console.log('[AppProvider] Repositories initialized');
        
        // Initialize services that depend on repositories
        const deviceService = new DeviceService(storageService);
        
        // Prioritize Bluetooth service creation for background mode
        const bluetoothService = new BluetoothService(
          deviceService,
          sensorDataRepository,
          athleteRepository,
          bluetoothHandler
        );

        // In background mode, we prioritize getting the Bluetooth service ready
        // and defer other non-critical initializations
        if (isBackgroundLaunch) {
          console.log('[AppProvider] Background launch detected, prioritizing Bluetooth service initialization');
          
          // Create minimal appSetupService to avoid null references
          const minimalAppSetupService = new AppSetupService(
            storageService,
            databaseManager
          );
          
          // Set core services needed for Bluetooth background operation
          setServices({
            databaseManager,
            storageService,
            deviceService,
            bluetoothService,
            appSetupService: minimalAppSetupService,
            athleteRepository,
            sensorDataRepository,
            initialized: true
          });
          
          setInitialized(true);
          console.log('[AppProvider] Core services initialized for background operation');
          
          // Listen for app coming to foreground to complete remaining setup
          const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
              console.log('[AppProvider] App came to foreground, completing full initialization');
              // Complete remaining setup when app comes to foreground
              completeSetup(storageService, databaseManager, bluetoothService);
              // Remove listener once we've handled the transition
              subscription.remove();
            }
          });
        } else {
          // Normal foreground launch - complete full setup immediately
          const appSetupService = new AppSetupService(
            storageService,
            databaseManager
          );
          
          // Check if this is first launch and perform setup if needed
          console.log('[AppProvider] BEFORE appSetupService.ensureInitialized()');
          await appSetupService.ensureInitialized();
          console.log('[AppProvider] AFTER appSetupService.ensureInitialized()');
          
          // Set all services in state for context
          console.log('[AppProvider] Setting services and initialized state...');
          setServices({
            databaseManager,
            storageService,
            deviceService,
            bluetoothService,
            appSetupService,
            athleteRepository,
            sensorDataRepository,
            initialized: true
          });
          
          setInitialized(true);
          console.log('[AppProvider] App dependencies setup complete');
        }
      } catch (err: any) {
        console.error('[AppProvider] DETAILED setup error:', err, err.stack);
        setError(err.message || 'Failed to initialize app');
      }
    }
    
    // Helper function to complete setup when app comes to foreground
    async function completeSetup(
      storageService: StorageService,
      databaseManager: DatabaseManager,
      bluetoothService: BluetoothService
    ) {
      try {
        const appSetupService = new AppSetupService(
          storageService,
          databaseManager
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
          Error: {error}
        </Text>
        <Text style={{ color: '#fff', textAlign: 'center', marginHorizontal: 20 }}>
          Please restart the app or contact support.
        </Text>
      </View>
    );
  }

  return (
    <AppContext.Provider value={services!}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to access the app context
 * @throws Error if used outside of AppProvider
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Custom hook to access the storage service
 */
export function useStorageService(): StorageService {
  const { storageService } = useAppContext();
  return storageService;
}

/**
 * Custom hook to access the device service
 */
export function useDeviceService(): DeviceService {
  const { deviceService } = useAppContext();
  return deviceService;
}

/**
 * Custom hook to access the bluetooth service
 */
export function useBluetoothService(): BluetoothService {
  const { bluetoothService } = useAppContext();
  return bluetoothService;
}

/**
 * Custom hook to access the app setup service
 */
export function useAppSetupService(): AppSetupService {
  const { appSetupService } = useAppContext();
  return appSetupService;
}

/**
 * Custom hook to access the athlete repository
 */
export function useAthleteRepository(): AthleteRepository {
  const { athleteRepository } = useAppContext();
  return athleteRepository;
}

/**
 * Custom hook to access the sensor data repository
 */
export function useSensorDataRepository(): SensorDataRepository {
  const { sensorDataRepository } = useAppContext();
  return sensorDataRepository;
} 