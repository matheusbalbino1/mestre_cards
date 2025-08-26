import { getDB } from "./index"

export type Card = {
  id: string
  deck_id: string
  front: string
  back: string
  media?: string | null
  created_at?: string
  updated_at?: string
}

export type CardWithDue = Card & {
  due_date?: string | null
  due_at?: string | null // timestamp completo ISO
  last_review_at?: string | null
}

export async function listCardsByDeck(deckId: string): Promise<CardWithDue[]> {
  const db = await getDB()
  const now = new Date().toISOString()

  return db.getAllAsync<CardWithDue>(
    `SELECT c.id, c.deck_id, c.front, c.back, c.media, c.created_at, c.updated_at,
            s.due_date, s.due_at, s.last_review_at
       FROM cards c
  LEFT JOIN scheduling_state s ON s.card_id = c.id
      WHERE c.deck_id = ?
   ORDER BY 
     CASE 
       WHEN s.due_at IS NOT NULL THEN 
         CASE 
           WHEN s.due_at <= ? THEN 0  -- Atrasados primeiro (prioridade máxima)
           ELSE 1                     -- Futuros depois
         END
       WHEN s.due_date IS NOT NULL THEN 
         CASE 
           WHEN s.due_date <= ? THEN 0  -- Atrasados primeiro
           ELSE 1                       -- Futuros depois
         END
       ELSE 2  -- Sem scheduling (novos) por último
     END,
     COALESCE(s.due_at, s.due_date || 'T00:00:00', '9999-12-31') ASC,  -- Ordem cronológica
     c.created_at DESC  -- Cards mais recentes primeiro em caso de empate`,
    deckId,
    now,
    now.slice(0, 10)
  )
}

export async function createCard(card: Card) {
  const db = await getDB()
  const now = card.updated_at ?? new Date().toISOString()
  await db.runAsync(
    `INSERT INTO cards (id,deck_id,front,back,media,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?)`,
    card.id,
    card.deck_id,
    card.front,
    card.back,
    card.media ?? null,
    card.created_at ?? now,
    now
  )
}

export async function deleteCard(id: string) {
  const db = await getDB()
  await db.runAsync(`DELETE FROM scheduling_state WHERE card_id=?`, id)
  await db.runAsync(`DELETE FROM cards WHERE id=?`, id)
}
