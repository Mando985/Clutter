import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('clutter.db');

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS clutter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
}