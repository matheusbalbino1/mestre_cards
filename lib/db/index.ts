// lib/db/index.ts
import * as SQLite from "expo-sqlite"
import { Alert } from "react-native"
import { DB_CONFIG, DB_PRAGMAS } from "./config"
import { applyMigrations } from "./migrations"

let db: SQLite.SQLiteDatabase | null = null
let initPromise: Promise<void> | null = null

export async function getDB() {
  if (!db) {
    Alert.alert("🗄️ Banco", "Abrindo banco de dados...")
    try {
      db = await SQLite.openDatabaseAsync(DB_CONFIG.name)
      Alert.alert("✅ Sucesso", "Banco de dados aberto com sucesso")

      // Aplica configurações de performance
      for (const pragma of DB_PRAGMAS) {
        try {
          await db.execAsync?.(pragma)
        } catch (error) {
          Alert.alert("⚠️ Aviso", `Pragma ${pragma} falhou: ${error}`)
        }
      }
      Alert.alert("⚡ Configuração", "Configurações SQLite aplicadas")
    } catch (error) {
      Alert.alert("❌ Erro", `Erro ao abrir banco de dados: ${error}`)
      throw error
    }
  }
  return db
}

/** Verifica se as tabelas existem */
export async function checkTablesExist(): Promise<boolean> {
  try {
    const db = await getDB()
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='decks'"
    )
    const exists = Boolean(result && result.count > 0)
    Alert.alert("🔍 Verificação", `Tabela 'decks' existe: ${exists}`)
    return exists
  } catch (error) {
    Alert.alert("❌ Erro", `Erro ao verificar tabelas: ${error}`)
    return false
  }
}

/** Chame na Splash antes de ir para a Home */
export function ensureDBReady() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      Alert.alert("🚀 Preparação", "Iniciando preparação do banco de dados...")
      const db = await getDB()
      Alert.alert("📋 Migrações", "Aplicando migrações...")
      await applyMigrations(db)

      // Verifica se as tabelas foram criadas
      const tablesExist = await checkTablesExist()
      if (!tablesExist) {
        throw new Error("Tabelas não foram criadas após as migrações")
      }

      Alert.alert("✅ Concluído", "Banco de dados preparado com sucesso")
    } catch (error) {
      Alert.alert("💥 Erro Fatal", `Erro ao preparar banco de dados: ${error}`)
      throw error
    }
  })()
  return initPromise
}

/** Função para resetar o banco (útil para debug) */
export async function resetDatabase() {
  if (db) {
    await db.closeAsync()
    db = null
  }
  initPromise = null
  Alert.alert("🔄 Reset", "Banco de dados resetado")
}

export async function initializeDatabase() {
  try {
    console.log("Inicializando banco de dados...")
    db = await SQLite.openDatabaseAsync(DB_CONFIG.name)

    // Criar tabelas se não existirem
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        media TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (deck_id) REFERENCES decks (id)
      );
    `)

    console.log("Banco de dados inicializado com sucesso")
    return db
  } catch (error) {
    console.error("Erro ao inicializar banco:", error)
    throw error
  }
}
