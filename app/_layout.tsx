import { Stack } from 'expo-router';
import { initDb } from '../db';
import { SQLiteProvider } from 'expo-sqlite';
initDb();


export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="clutter.db" onInit={initDb}>
      <Stack />
    </SQLiteProvider>
  );
}