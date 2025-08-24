import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import React from "react"
import { Alert, Button, Pressable, Text, View } from "react-native"
import {
  answerCard,
  loadDueToday,
  type StudyItem,
} from "../lib/db/scheduling.repo"
import { Rating } from "../lib/srs/sm2"

// Função para formatar o tempo restante
function formatTimeUntil(dueAt: string): string {
  const now = new Date()
  const due = new Date(dueAt)
  const diffMs = due.getTime() - now.getTime()

  if (diffMs <= 0) return "Disponível agora"

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} dia${diffDays > 1 ? "s" : ""}`
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}min`
  } else {
    return `${diffMinutes} min`
  }
}

export default function StudyScreen() {
  const { deck } = useLocalSearchParams<{ deck?: string }>()
  const [queue, setQueue] = React.useState<StudyItem[]>([])
  const [flipped, setFlipped] = React.useState(false)

  const [hasAnswered, setHasAnswered] = React.useState(false)
  const [handledPopup, setHandledPopup] = React.useState(false)
  const prevLenRef = React.useRef<number>(0)

  const reload = React.useCallback(async () => {
    const items = await loadDueToday(deck)
    setQueue(items)
    setFlipped(false)
    setHasAnswered(false)
    setHandledPopup(false)
    prevLenRef.current = items.length
  }, [deck])

  React.useEffect(() => {
    reload()
  }, [reload])

  React.useEffect(() => {
    const prev = prevLenRef.current
    const curr = queue.length
    if (!handledPopup && hasAnswered && prev > 0 && curr === 0) {
      setHandledPopup(true)
      Alert.alert("Tudo certo!", "Deck estudado com sucesso 🎉", [
        { text: "OK", onPress: () => router.replace("/") },
      ])
    }
    prevLenRef.current = curr
  }, [queue.length, hasAnswered, handledPopup])

  if (queue.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <Text style={{ opacity: 0.7 }}>Nada para hoje</Text>
        <View style={{ height: 8 }} />
        <Button title="Voltar" onPress={() => router.replace("/")} />
      </View>
    )
  }

  const current = queue[0]
  let media: { frontImageUri?: string } | null = null
  try {
    media = current.media ? JSON.parse(current.media) : null
  } catch {}

  // Calcula quando o card estará disponível novamente
  const getNextReviewTime = () => {
    if (current.state.intervalMinutes > 0) {
      const lastReview = current.state.lastReviewAt
        ? new Date(current.state.lastReviewAt)
        : new Date()
      const nextReview = new Date(lastReview)
      nextReview.setMinutes(
        nextReview.getMinutes() + current.state.intervalMinutes
      )
      return formatTimeUntil(nextReview.toISOString())
    } else if (current.state.intervalDays > 0) {
      const lastReview = current.state.lastReviewAt
        ? new Date(current.state.lastReviewAt)
        : new Date()
      const nextReview = new Date(lastReview)
      nextReview.setDate(nextReview.getDate() + current.state.intervalDays)
      return formatTimeUntil(nextReview.toISOString())
    }
    return "Disponível agora"
  }

  async function respond(r: Rating) {
    await answerCard(current.card_id, r)
    setHasAnswered(true)
    setQueue((s) => s.slice(1))
    setFlipped(false)
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Vencidos: {queue.length}
        {deck ? `  •  Deck: ${deck}` : ""}
      </Text>

      {/* Informações do card atual */}
      <View
        style={{
          backgroundColor: "#f0f0f0",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 14, opacity: 0.7 }}>
          Repetições: {current.state.repetitions} • Facilidade:{" "}
          {current.state.ease.toFixed(1)} • Erros: {current.state.lapses || 0}
        </Text>
        {current.state.intervalMinutes > 0 && (
          <Text style={{ fontSize: 12, color: "#e74c3c", marginTop: 4 }}>
            ⏰ Próxima revisão em: {getNextReviewTime()}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => setFlipped((v) => !v)}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderRadius: 12,
          padding: 24,
        }}
      >
        {/* imagem só na frente */}
        {!flipped && media?.frontImageUri && (
          <Image
            source={{ uri: media.frontImageUri }}
            style={{
              width: "100%",
              height: 220,
              borderRadius: 12,
              marginBottom: 12,
              backgroundColor: "#eee",
            }}
            contentFit="cover"
          />
        )}

        <Text style={{ fontSize: 22, textAlign: "center" }}>
          {flipped ? current.back : current.front}
        </Text>
        <Text style={{ marginTop: 8, opacity: 0.6 }}>
          toque para {flipped ? "ocultar" : "revelar"}
        </Text>
      </Pressable>

      {flipped ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <Button title="Errei" onPress={() => respond(0)} />
          <Button title="Difícil" onPress={() => respond(1)} />
          <Button title="Bom" onPress={() => respond(2)} />
          <Button title="Fácil" onPress={() => respond(3)} />
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button title="Mostrar resposta" onPress={() => setFlipped(true)} />
        </View>
      )}
    </View>
  )
}
