import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { BONG_HITS_DATABASE_NAME, getInsertStatements } from "./utils";

const FIRST_LAUNCH_KEY: string = 'hasLaunched';

/*
 * Checks if the application is being launched by the user for the first time.
 */
export async function isFirstLaunch(): Promise<boolean> {
    return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) === null;
}

/*
 * Executes startup logic
 */
export async function initializeAppOnFirstLaunch() {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    initializeDatabase();
}

export async function getDevices() {

}

async function initializeDatabase() {
    try {
      const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
      await bongHitsDb.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (timestamp TIMESTAMP PRIMARY KEY NOT NULL, duration_ms INTEGER NOT NULL);`
            .concat(getInsertStatements())
          );
    }
    catch (e) {
      console.error(`Error creating ${BONG_HITS_DATABASE_NAME}`, e);
    }
}