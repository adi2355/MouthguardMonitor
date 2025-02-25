# Development Commands
- Start dev server: `npx expo start`
- Run on iOS: `npx expo run:ios`
- Run on Android: `npx expo run:android`
- Web: `npx expo start --web`
- Test: `npx jest --watchAll`
- Run single test: `npx jest -t "test name"` 
- Lint: `expo lint`

# Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces
- **Components**: Use functional components with memo() for optimization
- **Imports**: Group by 1) React/React Native 2) Libraries 3) Local components 4) Types/constants
- **Types**: Create interfaces for props and data; maintain in src/types.ts
- **Error Handling**: Use try/catch with clear error messages; propagate up when appropriate
- **Performance**: Memoize callbacks with useCallback, avoid unnecessary re-renders
- **Styling**: Use StyleSheet.create with COLORS constant from src/constants.ts
- **Architecture**: Store reusable components in app/components/, page components in app/(tabs)/

# Project Structure
React Native + Expo app with SQLite database and React Navigation (file-based routing).
Organize code by feature, use TypeScript interfaces for type safety.