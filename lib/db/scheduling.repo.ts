import { reviewSM2, type Rating, type SRSState } from "../srs/sm2"
import { getDB } from "./index"

export type StudyItem = {
  card_id: string
  front: string
  back: string
  media?: string | null // ⬅️ adicionamos a mídia aqui
  state: SRSState
}

export async function loadDueToday(deckId?: string): Promise<StudyItem[]> {
  const db = await getDB()
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  const rows = await db.getAllAsync<any>(
    `
    SELECT c.id as card_id, c.front, c.back, c.media,      -- ⬅️ c.media
           s.repetitions, s.interval_days, s.interval_minutes, s.ease,
           s.due_date, s.last_review_at, s.lapses, s.due_at
      FROM cards c
 LEFT JOIN scheduling_state s ON s.card_id = c.id
     WHERE ${deckId ? "c.deck_id = ? AND " : ""}(
           s.card_id IS NULL
        OR COALESCE(s.due_at, s.due_date || 'T00:00:00') <= ?
     )
     LIMIT 100
    `,
    ...(deckId ? [deckId, nowIso] : [nowIso])
  )

  return rows.map((r) => {
    const state: SRSState = r.due_date
      ? {
          repetitions: r.repetitions,
          intervalDays: r.interval_days,
          intervalMinutes: r.interval_minutes || 0,
          ease: r.ease,
          dueDate: r.due_date,
          lastReviewAt: r.last_review_at,
          lapses: r.lapses,
        }
      : {
          repetitions: 0,
          intervalDays: 0,
          intervalMinutes: 0,
          ease: 2.5,
          dueDate: today,
        }
    return {
      card_id: r.card_id,
      front: r.front,
      back: r.back,
      media: r.media,
      state,
    }
  })
}

export async function answerCard(
  cardId: string,
  rating: Rating
): Promise<void> {
  const db = await getDB()
  const row = await db.getFirstAsync<any>(
    `SELECT repetitions, interval_days, interval_minutes, ease, due_date, last_review_at, lapses, due_at
       FROM scheduling_state WHERE card_id=?`,
    cardId
  )

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const current = row
    ? {
        repetitions: row.repetitions,
        intervalDays: row.interval_days,
        intervalMinutes: row.interval_minutes || 0,
        ease: row.ease,
        dueDate: row.due_date ?? todayStr,
        lastReviewAt: row.last_review_at,
        lapses: row.lapses,
      }
    : {
        repetitions: 0,
        intervalDays: 0,
        intervalMinutes: 0,
        ease: 2.5,
        dueDate: todayStr,
      }

  const next = reviewSM2(current, rating, now)

  const dueAt = new Date(now)
  if (next.intervalMinutes > 0) {
    dueAt.setMinutes(dueAt.getMinutes() + next.intervalMinutes)
  } else {
    dueAt.setDate(dueAt.getDate() + next.intervalDays)
  }

  await db.runAsync(
    `INSERT INTO scheduling_state
       (card_id, repetitions, interval_days, interval_minutes, ease, due_date, last_review_at, lapses, due_at)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(card_id) DO UPDATE SET
       repetitions=excluded.repetitions,
       interval_days=excluded.interval_days,
       interval_minutes=excluded.interval_minutes,
       ease=excluded.ease,
       due_date=excluded.due_date,
       last_review_at=excluded.last_review_at,
       lapses=excluded.lapses,
       due_at=excluded.due_at`,
    cardId,
    next.repetitions,
    next.intervalDays,
    next.intervalMinutes,
    next.ease,
    next.dueDate,
    next.lastReviewAt as string,
    next.lapses ?? 0,
    dueAt.toISOString()
  )
}

export async function resetCardScheduling(cardId: string): Promise<void> {
  const db = await getDB()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  await db.runAsync(
    `INSERT INTO scheduling_state
       (card_id, repetitions, interval_days, interval_minutes, ease, due_date, last_review_at, lapses, due_at)
     VALUES (?, 0, 0, 0, 2.5, ?, NULL, 0, ?)
     ON CONFLICT(card_id) DO UPDATE SET
       repetitions=0, interval_days=0, interval_minutes=0, ease=2.5,
       due_date=excluded.due_date, last_review_at=NULL, lapses=0,
       due_at=excluded.due_at`,
    cardId,
    today,
    now.toISOString()
  )
}
