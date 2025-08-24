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
    Alert.alert(
      "🔧 Migração v1",
      "Executando migração v1: criando tabelas base..."
    )
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
      Alert.alert("✅ Sucesso", "Migração v1 executada com sucesso")
    } catch (error) {
      Alert.alert("❌ Erro", `Erro na migração v1: ${error}`)
      throw error
    }
  },

  // v2
  async (db) => {
    Alert.alert(
      "🔧 Migração v2",
      "Executando migração v2: adicionando due_at..."
    )
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
      Alert.alert("✅ Sucesso", "Migração v2 executada com sucesso")
    } catch (error) {
      Alert.alert("❌ Erro", `Erro na migração v2: ${error}`)
      throw error
    }
  },

  // v3
  async (db) => {
    Alert.alert(
      "🔧 Migração v3",
      "Executando migração v3: adicionando interval_minutes..."
    )
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
      Alert.alert("✅ Sucesso", "Migração v3 executada com sucesso")
    } catch (error) {
      Alert.alert("❌ Erro", `Erro na migração v3: ${error}`)
      throw error
    }
  },
]

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  Alert.alert("🔍 Verificação", "Verificando versão atual do banco...")
  try {
    // Garante a tabela __meta e uma linha com versão 0
    await db.execAsync?.(`
      CREATE TABLE IF NOT EXISTS __meta (version INTEGER NOT NULL);
    `)

    const row = await db
      .getFirstAsync<{ version: number }>(`SELECT version FROM __meta LIMIT 1`)
      .catch(() => null)

    if (!row || typeof row.version !== "number") {
      Alert.alert("🆕 Inicialização", "Inicializando versão do banco para 0")
      await db.execAsync?.(`DELETE FROM __meta;`)
      await db.execAsync?.(`INSERT INTO __meta(version) VALUES (0);`)
      return 0
    }
    Alert.alert("📊 Versão", `Versão atual do banco: ${row.version}`)
    return row.version
  } catch (error) {
    Alert.alert("❌ Erro", `Erro ao verificar versão: ${error}`)
    throw error
  }
}

async function setCurrentVersion(db: SQLiteDatabase, v: number) {
  Alert.alert("🔄 Atualização", `Atualizando versão do banco para ${v}`)
  await db.execAsync?.(`UPDATE __meta SET version = ${v};`)
}

export async function applyMigrations(db: SQLiteDatabase) {
  Alert.alert("🚀 Migrações", "Iniciando aplicação de migrações...")
  try {
    const current = await getCurrentVersion(db)
    const target = MIGRATIONS.length

    Alert.alert("📈 Status", `Versão atual: ${current}, Versão alvo: ${target}`)

    for (let v = current; v < target; v++) {
      Alert.alert("🔄 Execução", `Executando migração ${v + 1}/${target}...`)
      await db.execAsync?.("BEGIN TRANSACTION;")
      try {
        await MIGRATIONS[v](db)
        await setCurrentVersion(db, v + 1)
        await db.execAsync?.("COMMIT;")
        Alert.alert("✅ Sucesso", `Migração ${v + 1} executada com sucesso`)
      } catch (e) {
        Alert.alert("❌ Erro", `Erro na migração ${v + 1}: ${e}`)
        await db.execAsync?.("ROLLBACK;")
        throw e
      }
    }
    Alert.alert(
      "🎉 Concluído",
      "Todas as migrações foram aplicadas com sucesso"
    )
  } catch (error) {
    Alert.alert("💥 Erro Fatal", `Erro ao aplicar migrações: ${error}`)
    throw error
  }
}
