import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import React from "react"
import { Alert, Button, Pressable, Text, View } from "react-native"
import { getDeck } from "../lib/db/decks.repo"
import {
  answerCard,
  loadDueToday,
  type StudyItem,
} from "../lib/db/scheduling.repo"
import { Rating } from "../lib/srs/sm2"

export default function StudyScreen() {
  const { deck } = useLocalSearchParams<{ deck?: string }>()
  const [queue, setQueue] = React.useState<StudyItem[]>([])
  const [flipped, setFlipped] = React.useState(false)
  const [deckName, setDeckName] = React.useState<string>("")

  const [hasAnswered, setHasAnswered] = React.useState(false)
  const [handledPopup, setHandledPopup] = React.useState(false)
  const prevLenRef = React.useRef<number>(0)

  const [failedCards, setFailedCards] = React.useState<Set<string>>(new Set())

  const reload = React.useCallback(async () => {
    const items = await loadDueToday(deck)
    setQueue(items)
    setFlipped(false)
    setHasAnswered(false)
    setHandledPopup(false)
    setFailedCards(new Set())
    prevLenRef.current = items.length

    // Busca o nome do deck
    if (deck) {
      try {
        const deckInfo = await getDeck(deck)
        setDeckName(deckInfo?.name || "")
      } catch (error) {
        console.error("Erro ao buscar nome do deck:", error)
      }
    }
  }, [deck])

  const current = queue[0]
  let media: { frontImageUri?: string } | null = null
  try {
    media = current.media ? JSON.parse(current.media) : null
  } catch {}

  async function respond(r: Rating) {
    const currentCardId = current.card_id
    const isLastCard = queue.length === 1

    if (r === Rating.Fail) {
      // Primeira vez que erra
      await answerCard(currentCardId, Rating.Fail)

      if (isLastCard) {
        // Se for o último card, mantém na fila para aparecer novamente
        setFailedCards((prev) => new Set(prev).add(currentCardId))
      } else {
        // Se não for o último, move para o final da fila
        setQueue((s) => {
          const [first, ...rest] = s
          return [...rest, first] // Move o primeiro para o final
        })
        setFailedCards((prev) => new Set(prev).add(currentCardId))
      }
    } else if (failedCards.has(currentCardId)) {
      await answerCard(currentCardId, Rating.Fail)
      setQueue((s) => s.slice(1)) // Remove o card da fila
      setFailedCards((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentCardId)
        return newSet
      })
    } else {
      // Acertou: remove o card da fila
      await answerCard(currentCardId, r)
      setQueue((s) => s.slice(1))
    }

    setHasAnswered(true)
    setFlipped(false)
  }

  React.useEffect(() => {
    reload()
  }, [reload])

  React.useEffect(() => {
    const prev = prevLenRef.current
    const curr = queue.length
    if (!handledPopup && hasAnswered && prev > 0 && curr === 0) {
      setHandledPopup(true)
      Alert.alert("Tudo certo!", "Deck estudado com sucesso 🎉", [
        { text: "OK", onPress: () => router.replace("/home" as any) },
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
        <Button title="Voltar" onPress={() => router.replace("/home" as any)} />
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 64,
        paddingHorizontal: 16,
        paddingBottom: 64,
      }}
    >
      {/* Header com nome do deck e botão Parar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <Button
            title="Parar"
            onPress={() => router.replace("/home" as any)}
            color="#666"
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            flex: 2,
            textAlign: "center",
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {deckName}
        </Text>
        <View style={{ flex: 1 }} />
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
        {!flipped && media?.frontImageUri && (
          <Image
            source={{ uri: media.frontImageUri }}
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: 12,
              marginBottom: 12,
              backgroundColor: "#eee",
              resizeMode: "contain",
            }}
            contentFit="cover"
          />
        )}

        <Text style={{ fontSize: 22, textAlign: "center" }}>
          {flipped ? current.back : current.front}
        </Text>
        <Text style={{ marginTop: 8, opacity: 0.6, fontSize: 15 }}>
          toque para {flipped ? "ocultar" : "revelar"}
        </Text>
      </Pressable>

      {flipped ? (
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              marginBottom: 12,
              opacity: 0.8,
            }}
          >
            Como você se saiu com essa questão?
          </Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <View style={{ flex: 1 }}>
              <Button title="Errei" onPress={() => respond(Rating.Fail)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Difícil" onPress={() => respond(Rating.Hard)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Normal" onPress={() => respond(Rating.Good)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Fácil" onPress={() => respond(Rating.Easy)} />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button title="Mostrar resposta" onPress={() => setFlipped(true)} />
        </View>
      )}
    </View>
  )
}
