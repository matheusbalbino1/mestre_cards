import { Alert } from "react-native"
import { getDB } from "./index"

export async function seedIfEmpty() {
  const db = await getDB()
  const count = await db
    .getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM decks`)
    .catch(() => undefined)
  if (count && count.c > 0) return

  Alert.alert("🌱 Seed", "Executando seed do banco...")
  const now = new Date().toISOString()
  await db.runAsync(
    `INSERT OR IGNORE INTO decks (id, name, description, tags, created_at, updated_at)
     VALUES ('deck-demo','Inglês Básico','Cards de exemplo', ?, ?, ?)`,
    JSON.stringify(["demo", "en"]),
    now,
    now
  )
  await db.runAsync(
    `INSERT OR IGNORE INTO cards (id, deck_id, front, back, media, created_at, updated_at)
     VALUES ('card-1','deck-demo','cat','gato',NULL,?,?)`,
    now,
    now
  )
  Alert.alert("✅ Seed", "Seed executado com sucesso")
}
