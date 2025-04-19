const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting app reset process...');

// 1. Clear AsyncStorage on Android emulator
const clearAsyncStorage = () => {
  return new Promise((resolve, reject) => {
    console.log('Clearing AsyncStorage...');
    exec('adb shell pm clear expo.canovareactnativeapp', (error, stdout, stderr) => {
      if (error) {
        console.warn('⚠️ Warning: Could not clear package data:', error.message);
        console.log('Will create a helper file to clear AsyncStorage on next app launch...');
        
        // Create a file that will clear AsyncStorage on next app launch
        const clearAsyncStorageCode = `
// This file is auto-generated to clear AsyncStorage on next app launch
// It should be imported in app/_layout.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAppData() {
  console.log('[AppReset] Clearing AsyncStorage...');
  try {
    await AsyncStorage.clear();
    console.log('[AppReset] AsyncStorage cleared successfully');
    // Delete the DB version key so migrations run again
    await AsyncStorage.removeItem('dbVersion');
    console.log('[AppReset] Database version reset');
    return true;
  } catch (error) {
    console.error('[AppReset] Error clearing AsyncStorage:', error);
    return false;
  }
}
`;
        fs.writeFileSync('./src/utils/resetAppData.ts', clearAsyncStorageCode);
        console.log('✅ Created resetAppData.ts helper file');
        
        // Now add an import for this file in _layout.tsx
        try {
          const layoutPath = './app/_layout.tsx';
          if (fs.existsSync(layoutPath)) {
            let layoutContent = fs.readFileSync(layoutPath, 'utf8');
            
            // Check if the import already exists
            if (!layoutContent.includes('import { clearAppData }')) {
              // Add the import and call it in useEffect
              const importStatement = `import { clearAppData } from '../src/utils/resetAppData';\n`;
              
              // Find the first useEffect in the RootLayout function
              const rootLayoutRegex = /export default function RootLayout\(\) {([\s\S]*?)return/;
              const match = rootLayoutRegex.exec(layoutContent);
              
              if (match && match[1]) {
                const updatedContent = match[1].includes('useEffect')
                  ? layoutContent.replace(
                      /useEffect\(\(\) => {/,
                      `useEffect(() => {\n    // Clear app data on startup\n    clearAppData().catch(err => console.error('[AppReset] Error:', err));\n`
                    )
                  : layoutContent.replace(
                      /export default function RootLayout\(\) {/,
                      `export default function RootLayout() {\n  useEffect(() => {\n    // Clear app data on startup\n    clearAppData().catch(err => console.error('[AppReset] Error:', err));\n  }, []);\n`
                    );
                
                fs.writeFileSync(layoutPath, importStatement + updatedContent);
                console.log('✅ Updated _layout.tsx to clear data on next launch');
              } else {
                console.warn('⚠️ Could not find RootLayout function in _layout.tsx');
              }
            } else {
              console.log('ℹ️ _layout.tsx already has the clearAppData import');
            }
          } else {
            console.warn('⚠️ Could not find app/_layout.tsx');
          }
        } catch (layoutError) {
          console.warn('⚠️ Error updating _layout.tsx:', layoutError);
        }
        
        resolve();
      } else {
        console.log('✅ AsyncStorage cleared successfully');
        resolve();
      }
    });
  });
};

// 2. Reset Metro bundler cache
const resetMetroCache = () => {
  return new Promise((resolve, reject) => {
    console.log('Clearing Metro bundler cache...');
    exec('npx react-native start --reset-cache', (error, stdout, stderr) => {
      // This will keep running, so we need to kill it after a few seconds
      setTimeout(() => {
        exec('pkill -f "react-native start"', () => {
          console.log('✅ Metro cache reset completed');
          resolve();
        });
      }, 5000);
    });
  });
};

// 3. Delete database files
const clearDatabaseFiles = () => {
  console.log('Looking for database files to clean up...');
  const dbPath = path.join(__dirname, 'assets', 'db');
  
  if (fs.existsSync(dbPath)) {
    console.log(`Found database directory at ${dbPath}`);
    try {
      const files = fs.readdirSync(dbPath);
      files.forEach(file => {
        if (file.endsWith('.db') || file.endsWith('.sqlite')) {
          const filePath = path.join(dbPath, file);
          console.log(`Deleting ${filePath}...`);
          fs.unlinkSync(filePath);
        }
      });
      console.log('✅ Database files cleared');
    } catch (err) {
      console.error('❌ Error clearing database files:', err);
    }
  } else {
    console.log('No database directory found at expected location');
  }
  
  return Promise.resolve();
};

// 4. Restart app
const restartApp = () => {
  console.log('Restarting the app...');
  exec('npx expo start --clear', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error restarting app:', error);
      return;
    }
    console.log(stdout);
  });
};

// Run the reset process
async function resetApp() {
  try {
    await clearAsyncStorage();
    await resetMetroCache();
    await clearDatabaseFiles();
    console.log('🎉 Reset process completed! Starting app...');
    restartApp();
  } catch (error) {
    console.error('❌ Reset process failed:', error);
    process.exit(1);
  }
}

resetApp();
