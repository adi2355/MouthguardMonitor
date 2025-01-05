import { Text, View, Button } from "react-native";
import { openDatabaseAsync, SQLiteDatabase, deleteDatabaseAsync } from 'expo-sqlite';


interface Counter {
  id: string,
  count: number
}

export default function App() {

  async function initDatabase() {
    try {
      const userDataDb: SQLiteDatabase = await openDatabaseAsync('userData');

      await userDataDb.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS userData (id TEXT PRIMARY KEY NOT NULL, count INTEGER);
        INSERT INTO userData (id, count) VALUES ('counter', 0);
      `);
      console.log('initialized database');
    } catch(e) {
      console.log('Error initalizing db');
      console.error(e);
    }

  }

  async function getCount(){
    try {
      const userDataDb: SQLiteDatabase = await openDatabaseAsync('userData');

      const firstRow: Counter = await userDataDb.getFirstAsync('SELECT * FROM userData') as Counter;
      console.log(firstRow.id, firstRow.count);

    } catch(e) {
      console.log('Error fetching count from db');
      console.error(e);
    }
  }

  async function incrementCounter() {
    try {
      const userDataDb: SQLiteDatabase = await openDatabaseAsync('userData');

      const counters: Counter[] = await userDataDb.getAllAsync(`SELECT * FROM userData WHERE id = 'counter'`);
      const count = counters[0].count + 1;
      await userDataDb.runAsync('UPDATE userData SET count = ? WHERE id = ?', count, 'counter');

    } catch(e) {
      console.log('Error fetching count from db');
      console.error(e);
    }
  }

  async function deleteTable() {
    try{
      deleteDatabaseAsync('userData')
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
      <Text>CRUD</Text>
      <Button title="Initalize Database" onPress={initDatabase}></Button>
      <Button title="getCount" onPress={getCount}></Button>
      <Button title="incrementCounter" onPress={incrementCounter}></Button>
      <Button title="deleteTable" onPress={deleteTable}></Button>
    </View>
  );
}
