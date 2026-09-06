import { Stack } from "expo-router";
import React from "react";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import {SafeAreaProvider} from "react-native-safe-area-context";

export default function RootLayout() {
    const initDb = async (db: SQLiteDatabase) => {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS clutter (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              album_id TEXT NOT NULL,
              asset_id TEXT UNIQUE,
              asset_uri TEXT NOT NULL,
              created_at INTEGER DEFAULT (strftime('%s','now'))
              );`
        );
    }
    return (
        <SafeAreaProvider>
            <SQLiteProvider databaseName="clutter.db" onInit={initDb}>
                <Stack screenOptions={{headerShown:false}}/>
            </SQLiteProvider>
        </SafeAreaProvider>

    );
}