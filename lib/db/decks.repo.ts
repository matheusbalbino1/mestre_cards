import { getDB } from "./index"

export type Deck = {
  id: string
  name: string
  description?: string | null
  tags?: string | null
  created_at?: string
  updated_at?: string
}

export async function listDecks(): Promise<Deck[]> {
  const db = await getDB()
  return db.getAllAsync<Deck>(`
    SELECT id,name,description,tags,created_at,updated_at
      FROM decks
     ORDER BY updated_at DESC NULLS LAST
  `)
}

export async function getDeck(id: string): Promise<Deck | null> {
  const db = await getDB()
  return db.getFirstAsync<Deck>(`SELECT * FROM decks WHERE id=?`, id)
}

export async function getDeckByName(name: string): Promise<Deck | null> {
  const db = await getDB()
  return db.getFirstAsync<Deck>(`SELECT * FROM decks WHERE name=?`, name)
}

export async function createDeck(deck: Deck) {
  const db = await getDB()

  // Verifica se já existe um deck com o mesmo nome
  const existingDeck = await getDeckByName(deck.name)
  if (existingDeck) {
    throw new Error(
      `Já existe um deck com o nome "${deck.name}". Escolha um nome diferente.`
    )
  }

  await db.runAsync(
    `INSERT INTO decks (id,name,description,tags,created_at,updated_at)
     VALUES (?,?,?,?,?,?)`,
    deck.id,
    deck.name,
    deck.description ?? null,
    deck.tags ?? null,
    deck.created_at ?? new Date().toISOString(),
    deck.updated_at ?? new Date().toISOString()
  )
}

/** ---- Stats com due_at ---- */
export type DeckStats = {
  id: string
  name: string
  description?: string | null
  tags?: string | null
  total_cards: number
  due_now: number // vencidos ou sem scheduling
  next_due_date?: string | null // YYYY-MM-DD (mantido p/ compat)
  next_due_at?: string | null // ISO timestamp do próximo
}

export async function listDecksWithStats(): Promise<DeckStats[]> {
  const db = await getDB()
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  return db.getAllAsync<DeckStats>(
    `
    SELECT
      d.id,
      d.name,
      d.description,
      d.tags,
      COUNT(c.id) AS total_cards,
      SUM(CASE
            WHEN s.card_id IS NULL THEN 1
            WHEN COALESCE(s.due_at, s.due_date || 'T00:00:00') <= ? THEN 1
            ELSE 0
          END) AS due_now,
      MIN(CASE
            WHEN s.due_date > ? THEN s.due_date
          END) AS next_due_date,
      MIN(CASE
            WHEN COALESCE(s.due_at, s.due_date || 'T00:00:00') > ?
            THEN COALESCE(s.due_at, s.due_date || 'T00:00:00')
          END) AS next_due_at
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN scheduling_state s ON s.card_id = c.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC NULLS LAST
    `,
    nowIso,
    today,
    nowIso
  )
}

export async function deleteDeck(id: string) {
  const db = await getDB()
  // remove scheduling de todos os cards do deck
  await db.runAsync(
    `DELETE FROM scheduling_state
      WHERE card_id IN (SELECT id FROM cards WHERE deck_id = ?)`,
    id
  )
  // remove cards
  await db.runAsync(`DELETE FROM cards WHERE deck_id = ?`, id)
  // remove deck
  await db.runAsync(`DELETE FROM decks WHERE id = ?`, id)
}
