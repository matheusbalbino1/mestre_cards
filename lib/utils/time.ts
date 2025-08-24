// Mostra "falta 2h 30m", "vence hoje", "atrasado há 1h 15m" se <72h
export type DueLabel = {
  text: string
  status: "overdue" | "today" | "future" | "none"
}

/**
 * dueDate: 'YYYY-MM-DD' (compat)
 * dueAt: ISO completo (preferível se existir)
 */
export function formatDueLabel(
  dueDate?: string | null,
  now = new Date(),
  dueAt?: string | null
): DueLabel {
  if (!dueDate && !dueAt) {
    return { text: "novo", status: "none" }
  }

  const target = dueAt
    ? new Date(dueAt)
    : new Date(String(dueDate) + "T00:00:00")

  const msDiff = target.getTime() - now.getTime()
  const hourMs = 60 * 60 * 1000
  const minuteMs = 60 * 1000
  const dayMs = 24 * hourMs

  const dayStr = (d: Date) => d.toISOString().slice(0, 10)

  // "vence hoje" se mesma data do now
  if (dayStr(target) === dayStr(now)) {
    return { text: "vence hoje", status: "today" }
  }

  if (msDiff > 0) {
    if (msDiff < 72 * hourMs) {
      const hours = Math.floor(msDiff / hourMs)
      const minutes = Math.floor((msDiff % hourMs) / minuteMs)
      const h = hours > 0 ? `${hours}h` : ""
      const m = minutes > 0 ? `${minutes}m` : hours === 0 ? "0m" : ""
      const sep = h && m ? " " : ""
      return { text: `falta ${h}${sep}${m}`.trim(), status: "future" }
    }
    const days = Math.ceil(msDiff / dayMs)
    return { text: `falta ${days}d`, status: "future" }
  } else {
    const late = Math.abs(msDiff)
    if (late < 72 * hourMs) {
      const hours = Math.floor(late / hourMs)
      const minutes = Math.floor((late % hourMs) / minuteMs)
      const h = hours > 0 ? `${hours}h` : ""
      const m = minutes > 0 ? `${minutes}m` : hours === 0 ? "0m" : ""
      const sep = h && m ? " " : ""
      return { text: `atrasado há ${h}${sep}${m}`.trim(), status: "overdue" }
    }
    const days = Math.ceil(late / dayMs)
    return { text: `atrasado há ${days}d`, status: "overdue" }
  }
}
