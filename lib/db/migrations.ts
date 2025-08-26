// lib/db/migrations.ts
import type { SQLiteDatabase } from "expo-sqlite"
import { Alert } from "react-native"

type Migration = (db: SQLiteDatabase) => Promise<void>

/**
 * MIGRATIONS:
 * v1: cria tabelas base (sem due_at)
 * v2: adiciona due_at e faz backfill
 * v3: adiciona interval_minutes para revisões rápidas
 */
const MIGRATIONS: Migration[] = [
  // v1
  async (db) => {
    try {
      await db.execAsync?.(`
        -- metadados (já garantimos em getCurrentVersion, mas manter aqui é idempotente)
        CREATE TABLE IF NOT EXISTS __meta (version INTEGER NOT NULL);

        CREATE TABLE IF NOT EXISTS decks(
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          tags TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cards(
          id TEXT PRIMARY KEY,
          deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
          front TEXT NOT NULL,
          back TEXT NOT NULL,
          media TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scheduling_state(
          card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
          repetitions INTEGER DEFAULT 0,
          interval_days INTEGER DEFAULT 0,
          ease REAL DEFAULT 2.5,
          due_date TEXT,
          last_review_at TEXT,
          lapses INTEGER DEFAULT 0
        );
      `)
    } catch (error) {
      console.error(`###### Erro na migração v1: ${error} ######`)
      Alert.alert("❌ Erro", `Erro na migração v1: ${error}`)
      throw error
    }
  },

  // v2
  async (db) => {
    try {
      // adiciona due_at se não existir
      await db
        .execAsync?.(`ALTER TABLE scheduling_state ADD COLUMN due_at TEXT;`)
        .catch(() => {})
      // backfill de due_at
      await db.execAsync?.(`
        UPDATE scheduling_state
           SET due_at = COALESCE(due_at, CASE
             WHEN due_date IS NOT NULL THEN due_date || 'T00:00:00'
             ELSE NULL
           END);
      `)
    } catch (error) {
      console.error(`###### Erro na migração v2: ${error} ######`)
      Alert.alert("❌ Erro", `Erro na migração v2: ${error}`)
      throw error
    }
  },

  // v3
  async (db) => {
    try {
      // adiciona interval_minutes se não existir
      await db
        .execAsync?.(
          `ALTER TABLE scheduling_state ADD COLUMN interval_minutes INTEGER DEFAULT 0;`
        )
        .catch(() => {})
      // backfill de interval_minutes para 0
      await db.execAsync?.(`
        UPDATE scheduling_state
           SET interval_minutes = 0
           WHERE interval_minutes IS NULL;
      `)
    } catch (error) {
      console.error(`###### Erro na migração v3: ${error} ######`)
      Alert.alert("❌ Erro", `Erro na migração v3: ${error}`)
      throw error
    }
  },
]

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    // Garante a tabela __meta e uma linha com versão 0
    await db.execAsync?.(`
      CREATE TABLE IF NOT EXISTS __meta (version INTEGER NOT NULL);
    `)

    const row = await db
      .getFirstAsync<{ version: number }>(`SELECT version FROM __meta LIMIT 1`)
      .catch(() => null)

    if (!row || typeof row.version !== "number") {
      await db.execAsync?.(`DELETE FROM __meta;`)
      await db.execAsync?.(`INSERT INTO __meta(version) VALUES (0);`)
      return 0
    }
    return row.version
  } catch (error) {
    console.error(`###### Erro ao verificar versão: ${error} ######`)
    Alert.alert("❌ Erro", `Erro ao verificar versão: ${error}`)
    throw error
  }
}

async function setCurrentVersion(db: SQLiteDatabase, v: number) {
  await db.execAsync?.(`UPDATE __meta SET version = ${v};`)
}

export async function applyMigrations(db: SQLiteDatabase) {
  try {
    const current = await getCurrentVersion(db)
    const target = MIGRATIONS.length

    for (let v = current; v < target; v++) {
      await db.execAsync?.("BEGIN TRANSACTION;")
      try {
        await MIGRATIONS[v](db)
        await setCurrentVersion(db, v + 1)
        await db.execAsync?.("COMMIT;")
      } catch (e) {
        console.error(`###### Erro na migração ${v + 1}: ${e} ######`)
        Alert.alert("❌ Erro", `Erro na migração ${v + 1}: ${e}`)
        await db.execAsync?.("ROLLBACK;")
        throw e
      }
    }
  } catch (error) {
    console.error(`###### Erro ao aplicar migrações: ${error} ######`)
    Alert.alert("💥 Erro Fatal", `Erro ao aplicar migrações: ${error}`)
    throw error
  }
}
