# Mouthguard Monitoring App

This app allows monitoring of mouthguard sensors for athlete tracking and impact detection.

## Development Setup

1. Make sure you have Node.js and npm installed
2. Install Expo CLI: `npm install -g expo-cli`
3. Install dependencies: `npm install`
4. Run the app: `npx expo start`

## Troubleshooting

### App Not Rendering/Blank Screen

If you encounter a blank screen or the app is not rendering properly:

1. Try clearing the app data with our reset script:
   ```
   node reset-app.js
   ```
   This will:
   - Clear AsyncStorage
   - Reset the Metro bundler cache
   - Set up a one-time reset for the app on next launch

2. If the app is still having issues, you can manually reset by:
   - Deleting the AsyncStorage values:
     ```
     npx react-native-async-storage-dev-menu reset
     ```
   - Clearing Metro cache:
     ```
     npx expo start --clear
     ```

### Common Issues

1. **Missing Components Error**: The app may reference components that were removed during cleanup. Check the specific error message for the file that's causing the issue and remove it or update its imports.

2. **Database Migration Issues**: If you encounter database migration problems, check:
   - The `src/migrations` folder for current migrations
   - The `src/DatabaseManager.ts` file for database init logic

3. **Build Errors**: If you encounter errors while building, make sure to check for references to removed components:
   ```
   grep -r "removedComponent" ./app
   ```
   
4. **Navigation Issues**: Make sure all screens referenced in navigation are available in the codebase.

## Project Structure

- `/app` - Main application screens and navigation
  - `/(tabs)` - Tab-based navigation screens
  - `/components` - Reusable components
  - `/context` - React context providers

- `/src` - Core application logic
  - `/contexts` - Context providers for app state
  - `/migrations` - Database migrations
  - `/providers` - App state providers
  - `/repositories` - Data access layer
  - `/services` - Business logic services
  - `/utils` - Utility functions

## Reset Process

The app includes a one-time reset process that runs automatically after code changes. This helps prevent issues with stale data or incompatible database schemas.

If you want to force a reset, you can:

1. Delete the `RESET_PERFORMED` key from AsyncStorage
2. Run the app again

Or simply run the reset script:
```
node reset-app.js
```

## App Features

- Dashboard for monitoring athletes and devices
- Live monitoring of sensor data
- Reports and analytics
- Device management
- Athlete profile management # MouthguardMonitor
