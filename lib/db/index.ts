// lib/db/index.ts
import * as SQLite from "expo-sqlite"
import { Alert } from "react-native"
import { Subject } from "rxjs"
import { DB_CONFIG, DB_PRAGMAS } from "./config"
import { applyMigrations } from "./migrations"

export enum DatabaseStatus {
  INITIALIZING = "Inicializando...",
  INITIALIZED = "Inicializado",
  MIGRATING = "Migrando...",
  SEEDING = "Inserindo dados...",
  ERROR = "Erro ao inicializar",
}

let db: SQLite.SQLiteDatabase | null = null

export async function seedIfEmpty(databaseStatus$: Subject<DatabaseStatus>) {
  const db = await getDB()

  const count = await db
    .getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM decks`)
    .catch(() => ({ c: 0 }))

  if (count && count.c > 0) {
    return
  }

  databaseStatus$.next(DatabaseStatus.SEEDING)

  const now = new Date().toISOString()

  try {
    await db.runAsync(
      `INSERT INTO decks (id, name, description, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "deck-demo",
      "Inglês Básico",
      "Deck de exemplo com vocabulário básico em inglês",
      JSON.stringify(["demo", "en", "vocabulário"]),
      now,
      now
    )

    await db.runAsync(
      `INSERT INTO decks (id, name, description, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "deck-geo",
      "Em que país fica?",
      "Teste seus conhecimentos de geografia com cidades e monumentos famosos",
      JSON.stringify(["demo", "geografia", "mundo", "cidades"]),
      now,
      now
    )

    await db.runAsync(
      `INSERT INTO decks (id, name, description, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "deck-riddles",
      "O que é, o que é?",
      "Divirta-se com adivinhas clássicas e desafiadoras para exercitar o raciocínio",
      JSON.stringify(["demo", "adivinhas", "raciocínio", "diversão"]),
      now,
      now
    )

    const englishCards = [
      { front: "cat", back: "gato" },
      { front: "dog", back: "cachorro" },
      { front: "house", back: "casa" },
      { front: "car", back: "carro" },
      { front: "book", back: "livro" },
      { front: "water", back: "água" },
      { front: "food", back: "comida" },
      { front: "time", back: "tempo" },
      { front: "work", back: "trabalho" },
      { front: "money", back: "dinheiro" },
      { front: "family", back: "família" },
      { front: "friend", back: "amigo" },
      { front: "phone", back: "telefone" },
      { front: "computer", back: "computador" },
      { front: "school", back: "escola" },
      { front: "city", back: "cidade" },
      { front: "country", back: "país" },
      { front: "language", back: "idioma" },
      { front: "music", back: "música" },
      { front: "movie", back: "filme" },
      { front: "day", back: "dia" },
      { front: "night", back: "noite" },
      { front: "sun", back: "sol" },
      { front: "moon", back: "lua" },
      { front: "tree", back: "árvore" },
    ]

    for (const card of englishCards) {
      await db.runAsync(
        `INSERT INTO cards (id, deck_id, front, back, media, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        "deck-demo",
        card.front,
        card.back,
        null,
        now,
        now
      )
    }

    const geographyCards = [
      { front: "Torre Eiffel", back: "França" },
      { front: "Big Ben", back: "Inglaterra" },
      { front: "Machu Picchu", back: "Peru" },
      { front: "Cristo Redentor", back: "Brasil" },
      { front: "Taj Mahal", back: "Índia" },
      { front: "Muralha da China", back: "China" },
      { front: "Coliseu", back: "Itália" },
      { front: "Pirâmides de Gizé", back: "Egito" },
      { front: "Estátua da Liberdade", back: "Estados Unidos" },
      { front: "Sidney Opera House", back: "Austrália" },
      { front: "Tóquio", back: "Japão" },
      { front: "Moscou", back: "Rússia" },
      { front: "Cidade do México", back: "México" },
      { front: "Toronto", back: "Canadá" },
      { front: "Buenos Aires", back: "Argentina" },
      { front: "Madrid", back: "Espanha" },
      { front: "Berlim", back: "Alemanha" },
      { front: "Amsterdã", back: "Holanda" },
      { front: "Viena", back: "Áustria" },
      { front: "Praga", back: "República Tcheca" },
    ]

    for (const card of geographyCards) {
      await db.runAsync(
        `INSERT INTO cards (id, deck_id, front, back, media, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        "deck-geo",
        card.front,
        card.back,
        null,
        now,
        now
      )
    }

    const riddleCards = [
      {
        front:
          "O que é, o que é? Tem cabeça e tem dente, mas não é gente nem é animal.",
        back: "Alho",
      },
      {
        front: "O que é, o que é? Quanto mais cresce, menos se vê.",
        back: "Escuridão",
      },
      {
        front:
          "O que é, o que é? Tem asas, mas não voa; tem pernas, mas não anda; tem boca, mas não come.",
        back: "Mesa",
      },
      {
        front: "O que é, o que é? Quanto mais se tira, maior fica.",
        back: "Buraco",
      },
      {
        front:
          "O que é, o que é? Tem chaves, mas não abre portas; tem espaço, mas não cabe nada; tem números, mas não conta.",
        back: "Teclado",
      },
      {
        front: "O que é, o que é? Quanto mais se lava, mais suja fica.",
        back: "Água",
      },
      {
        front:
          "O que é, o que é? Tem olhos, mas não vê; tem boca, mas não fala; tem ouvidos, mas não ouve.",
        back: "Batata",
      },
      {
        front: "O que é, o que é? Quanto mais se tira, mais se tem.",
        back: "Fotografia",
      },
      {
        front:
          "O que é, o que é? Tem dentes, mas não morde; tem língua, mas não fala.",
        back: "Zíper",
      },
      {
        front: "O que é, o que é? Quanto mais se enche, mais vazio fica.",
        back: "Buraco",
      },
    ]

    for (const card of riddleCards) {
      await db.runAsync(
        `INSERT INTO cards (id, deck_id, front, back, media, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        "deck-riddles",
        card.front,
        card.back,
        null,
        now,
        now
      )
    }
  } catch (error) {
    console.error(`###### Erro ao executar seed: ${error} ######`)
    Alert.alert("❌ Erro", `Erro ao executar seed: ${error}`)
    throw error
  }
}

export async function getDB() {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync(DB_CONFIG.name)
    } catch (error) {
      console.error(`###### Erro ao abrir banco de dados: ${error} ######`)
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
    return exists
  } catch (error) {
    console.error(`###### Erro ao verificar tabelas: ${error} ######`)
    Alert.alert("❌ Erro", `Erro ao verificar tabelas: ${error}`)
    return false
  }
}

export async function initializeDatabase(
  dbProvider: SQLite.SQLiteDatabase,
  databaseStatus$: Subject<DatabaseStatus>
) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    databaseStatus$.next(DatabaseStatus.INITIALIZING)

    await dbProvider.execAsync(`
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    await dbProvider.execAsync(`
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

    for (const pragma of DB_PRAGMAS) {
      try {
        await dbProvider.execAsync?.(pragma)
      } catch (error) {
        Alert.alert("⚠️ Aviso", `Pragma ${pragma} falhou: ${error}`)
      }
    }

    databaseStatus$.next(DatabaseStatus.MIGRATING)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await applyMigrations(dbProvider)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const tablesExist = await checkTablesExist()
    if (!tablesExist) {
      throw new Error("Tabelas não foram criadas após as migrações")
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await seedIfEmpty(databaseStatus$)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    databaseStatus$.next(DatabaseStatus.INITIALIZED)
    return
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    Alert.alert("❌ Erro", `Erro ao inicializar banco de dados: ${error}`)
    databaseStatus$.next(DatabaseStatus.ERROR)
    throw error
  }
}
