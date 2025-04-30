import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useMemo } from 'react';
import { View, Text, ActivityIndicator, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseManager, databaseManager } from '../DatabaseManager';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';
import { BluetoothService } from '../services/BluetoothService';
import { AppSetupService } from '../services/AppSetupService';
import { AthleteRepository } from '../repositories/AthleteRepository';
import { SensorDataRepository } from '../repositories/SensorDataRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { BluetoothHandler } from '../contexts/BluetoothContext';
import { SessionProvider, useSession } from '../contexts/SessionContext';

// Define the AppContext type
interface AppContextType {
  databaseManager: DatabaseManager;
  storageService: StorageService;
  deviceService: DeviceService;
  bluetoothServiceRef: React.MutableRefObject<BluetoothService | null>;
  appSetupService: AppSetupService;
  athleteRepository: AthleteRepository;
  sensorDataRepository: SensorDataRepository;
  sessionRepository: SessionRepository;
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
  const [services, setServices] = useState<Omit<AppContextType, 'bluetoothServiceRef'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackgroundLaunch, setIsBackgroundLaunch] = useState<boolean>(false);
  
  // Add ref for BluetoothService
  const bluetoothServiceRef = useRef<BluetoothService | null>(null);

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
        const sessionRepository = new SessionRepository(db);
        console.log('[AppProvider] Repositories initialized');
        
        // Initialize services that depend on repositories
        const deviceService = new DeviceService(storageService);
        
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
            appSetupService: minimalAppSetupService,
            athleteRepository,
            sensorDataRepository,
            sessionRepository,
            initialized: true
          });
          
          setInitialized(true);
          console.log('[AppProvider] Core services initialized for background operation');
          
          // Listen for app coming to foreground to complete remaining setup
          const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
              console.log('[AppProvider] App came to foreground, completing full initialization');
              // Complete remaining setup when app comes to foreground
              completeSetup(storageService, databaseManager);
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
          
          // Set all services in state for context (WITHOUT BluetoothService)
          console.log('[AppProvider] Setting services and initialized state...');
          setServices({
            databaseManager,
            storageService,
            deviceService,
            appSetupService,
            athleteRepository,
            sensorDataRepository,
            sessionRepository,
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
      databaseManager: DatabaseManager
    ) {
      try {
        const appSetupService = new AppSetupService(
          storageService,
          databaseManager
        );
        
        // Ensure app is properly initialized
        await appSetupService.ensureInitialized();
        
        console.log('[AppProvider] ✅ Full app initialization completed');
      } catch (err: any) {
        console.error('[AppProvider] Error during full initialization:', err);
        setError(err.message || 'Failed to complete initialization');
      }
    }
    
    // Start the initialization process
    setupApp();
    
  }, [isBackgroundLaunch]);

  // Create the context value with memoization
  const contextValue = useMemo(() => {
    if (!services) return null;
    return {
      ...services,
      bluetoothServiceRef,
    };
  }, [services]);

  // Special component that creates the actual BluetoothService once SessionContext is available
  const BluetoothServiceInitializer = () => {
    const sessionContext = useSession();
    // Use a ref to track if we've already created the service
    const serviceCreatedRef = React.useRef(false);
    
    // Include sessionContext in dependency array to properly update when it changes
    const getSessionContext = React.useCallback(() => sessionContext, [sessionContext]);
    
    useEffect(() => {
      // Skip if services isn't available yet
      if (!services) return;
      
      // Skip if we've already created the service to prevent infinite loops
      if (serviceCreatedRef.current || bluetoothServiceRef.current) return;
      
      // Create the actual bluetoothService now that we have SessionContext
      const bluetoothService = new BluetoothService(
        services.deviceService,
        services.sensorDataRepository,
        services.athleteRepository,
        getSessionContext,
        bluetoothHandler
      );
      
      // Store the service in the ref instead of in state
      bluetoothServiceRef.current = bluetoothService;
      
      // Mark that we've created the service
      serviceCreatedRef.current = true;
      console.log('[AppProvider] BluetoothService created with SessionContext');
      
    }, [services, getSessionContext]); // No longer updating services in this effect
    
    return null;
  };

  if (error) {
    // Display error state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
          Error initializing app
        </Text>
        <Text style={{ color: 'red', marginBottom: 20, textAlign: 'center' }}>
          {error}
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center' }}>
          Please restart the app or contact support if the problem persists.
        </Text>
      </View>
    );
  }

  if (!initialized || !contextValue) {
    // Display loading state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 20 }}>Initializing app dependencies...</Text>
      </View>
    );
  }

  // Provide the context value to children
  return (
    <AppContext.Provider value={contextValue}>
      <SessionProvider>
        <BluetoothServiceInitializer />
        {children}
      </SessionProvider>
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use the AppContext
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Custom hook to use the StorageService
 */
export function useStorageService(): StorageService {
  const { storageService } = useAppContext();
  return storageService;
}

/**
 * Custom hook to use the DeviceService
 */
export function useDeviceService(): DeviceService {
  const { deviceService } = useAppContext();
  return deviceService;
}

/**
 * Custom hook to use the BluetoothService
 */
export function useBluetoothService(): BluetoothService | null {
  const { bluetoothServiceRef } = useAppContext();
  return bluetoothServiceRef.current;
}

/**
 * Custom hook to use the AppSetupService
 */
export function useAppSetupService(): AppSetupService {
  const { appSetupService } = useAppContext();
  return appSetupService;
}

/**
 * Custom hook to use the AthleteRepository
 */
export function useAthleteRepository(): AthleteRepository {
  const { athleteRepository } = useAppContext();
  return athleteRepository;
}

/**
 * Custom hook to use the SensorDataRepository
 */
export function useSensorDataRepository(): SensorDataRepository {
  const { sensorDataRepository } = useAppContext();
  return sensorDataRepository;
}

/**
 * Custom hook to use the SessionRepository
 */
export function useSessionRepository(): SessionRepository {
  const { sessionRepository } = useAppContext();
  return sessionRepository;
} 