import { Text, View, Button } from "react-native";
import { deleteDatabaseAsync, openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { useEffect } from "react";
import { BONG_HITS_DATABASE_NAME, getInsertStatements } from "@/util/utils";

export default function App() {
  
  async function initDatabase() {
    try {
        const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
        await bongHitsDb.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (timestamp TIMESTAMP PRIMARY KEY NOT NULL, duration_ms INTEGER NOT NULL);
            \n\t`.concat(getInsertStatements()));
        console.log(`Created ${BONG_HITS_DATABASE_NAME} table!`);
    } 
    catch (e) {
        console.error(`Error creating ${BONG_HITS_DATABASE_NAME}`, e);
    }
}

  useEffect(() => {
    initDatabase();
  }, []);

  async function deleteTable() {
    try{
      deleteDatabaseAsync('BongHits')
      console.log('Table BongHits deleted')
    } catch (e) {
      console.error(e);
    }

  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Homepage</Text>
      <Button title="deleteTable" onPress={deleteTable}></Button>
    </View>
  );
}
