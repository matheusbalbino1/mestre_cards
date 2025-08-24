export enum Rating {
  Fail = 0, // Errei
  Hard = 1, // Difícil
  Good = 2, // Bom
  Easy = 3, // Fácil
}

export interface SRSState {
  repetitions: number // Número de repetições consecutivas corretas
  intervalDays: number // Intervalo em dias até a próxima revisão
  intervalMinutes: number // Intervalo em minutos para revisões rápidas (quando erra)
  ease: number // Fator de facilidade (inicia normalmente em 2.5)
  dueDate: string // Data da próxima revisão ('YYYY-MM-DD')
  lastReviewAt?: string // Timestamp da última revisão (ISO string)
  lapses?: number // Número de erros cometidos
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function reviewSM2(
  state: SRSState,
  rating: Rating,
  today: Date = new Date()
): SRSState {
  let { repetitions, intervalDays, intervalMinutes, ease } = state
  let lapses = state.lapses ?? 0

  if (rating === Rating.Fail) {
    // Caso de falha: reset reps, aumenta lapses e diminui ease
    repetitions = 0
    intervalDays = 0
    // Intervalo em minutos baseado no número de lapses
    // Primeira falha: 30 min, segunda: 2h, terceira: 4h, depois: 1 dia

    intervalMinutes = 30 // 30 minutos

    ease = Math.max(1.3, ease - 0.2) // Penaliza fator de facilidade
    lapses += 1
  } else {
    // Converter rating para q (escala SM-2: Hard=3, Good=4, Easy=5)
    const q = rating === Rating.Hard ? 3 : rating === Rating.Good ? 4 : 5

    // Atualiza ease ANTES do cálculo do intervalo (seguindo SM-2)
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ease = Math.min(3.0, Math.max(1.3, ease))

    // Calcula intervalo com base no número de repetições
    if (repetitions === 0) {
      intervalDays = 1
      intervalMinutes = 0
    } else if (repetitions === 1) {
      intervalDays = 6
      intervalMinutes = 0
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * ease))
      intervalMinutes = 0
    }

    // Só incrementa reps quando não erra
    repetitions += 1
  }

  const due = new Date(today)
  if (intervalMinutes > 0) {
    due.setMinutes(due.getMinutes() + intervalMinutes)
  } else {
    due.setDate(due.getDate() + intervalDays)
  }

  return {
    repetitions,
    intervalDays,
    intervalMinutes,
    ease,
    dueDate: formatLocalDate(due), // Usa data local para evitar problemas de UTC
    lastReviewAt: today.toISOString(),
    lapses,
  }
}
