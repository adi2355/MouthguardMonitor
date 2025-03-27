import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { DatabaseManager, databaseManager } from '../DatabaseManager';
import { BongHitsRepository } from '../repositories/BongHitsRepository';
import { StrainsRepository } from '../repositories/StrainsRepository';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';
import { BluetoothService } from '../services/BluetoothService';
import { AppSetupService } from '../services/AppSetupService';
import { BONG_HITS_DATABASE_NAME, STRAINS_DATABASE_NAME } from '../constants';
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

  useEffect(() => {
    async function setupApp() {
      try {
        console.log('Setting up app dependencies...');
        
        // Use singleton database manager instance
        const storageService = new StorageService();
        
        // Initialize database connections
        await databaseManager.initialize();
        const bongHitsDb = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
        const strainsDb = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
        
        // Initialize repositories
        const bongHitsRepository = new BongHitsRepository(bongHitsDb);
        const strainsRepository = new StrainsRepository(strainsDb);
        
        // Initialize services that depend on repositories
        const deviceService = new DeviceService(storageService);
        const bluetoothService = new BluetoothService(
          deviceService,
          bongHitsRepository,
          bluetoothHandler
        );
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
        console.log('App dependencies setup complete');
      } catch (err: any) {
        console.error('Error setting up app:', err);
        setError(err.message || 'Failed to initialize app');
      }
    }
    
    setupApp();
    
    // Cleanup function
    return () => {
      // Close database connections when app is unmounted
      if (services?.databaseManager) {
        services.databaseManager.cleanup().catch(err => {
          console.error('Error cleaning up database connections:', err);
        });
      }
    };
  }, [bluetoothHandler]);

  // Loading state
  if (!initialized || !services) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00e676" />
        <Text style={{ marginTop: 20, color: '#fff' }}>Initializing app...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
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

  // Render children with context
  return (
    <AppContext.Provider value={services}>
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