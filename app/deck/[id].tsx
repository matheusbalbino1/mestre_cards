// app/deck/[id].tsx
import { ColorGreen } from "@/constants/Colors"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { router, useLocalSearchParams } from "expo-router"
import React from "react"
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import uuid from "react-native-uuid"
import {
  createCard,
  deleteCard,
  listCardsByDeck,
  type CardWithDue,
} from "../../lib/db/cards.repo"
import { deleteDeck, getDeck } from "../../lib/db/decks.repo"
import { resetCardScheduling } from "../../lib/db/scheduling.repo"

/* ---------- helpers de tempo (sem "vence hoje") ---------- */
const HOUR_MS = 60 * 60 * 1000
const MIN_MS = 60 * 1000
const DAY_MS = 24 * HOUR_MS

function fmtHM(ms: number) {
  const h = Math.floor(ms / HOUR_MS)
  const m = Math.floor((ms % HOUR_MS) / MIN_MS)
  const hLabel = h > 0 ? `${h}h` : ""
  const mLabel = `${m}m`
  const sep = h > 0 ? " " : ""
  return `${hLabel}${sep}${mLabel}`.trim()
}

function formatDeckCooldownLabel(
  due_date?: string | null,
  due_at?: string | null
): { text: string; status: "future" | "overdue" | "none" } {
  const now = Date.now()
  if (!due_date && !due_at) return { text: "novo", status: "none" }

  let targetMs: number
  if (due_at) {
    targetMs = new Date(due_at).getTime()
  } else {
    // fallback para meia-noite; se for hoje, aponta para meia-noite de amanhã
    targetMs = new Date(String(due_date) + "T00:00:00").getTime()
    const targetDay = new Date(String(due_date) + "T00:00:00")
    const today = new Date()
    const sameDay =
      targetDay.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
    if (sameDay) {
      const midnightNext = new Date(today)
      midnightNext.setHours(24, 0, 0, 0)
      targetMs = midnightNext.getTime()
    }
  }

  const diff = targetMs - now
  if (diff > 0) {
    if (diff < 72 * HOUR_MS)
      return { text: `falta ${fmtHM(diff)}`, status: "future" }
    const days = Math.ceil(diff / DAY_MS)
    return { text: `falta ${days}d`, status: "future" }
  } else {
    const late = Math.abs(diff)
    if (late < 72 * HOUR_MS)
      return { text: `atrasado há ${fmtHM(late)}`, status: "overdue" }
    const daysLate = Math.ceil(late / DAY_MS)
    return { text: `atrasado há ${daysLate}d`, status: "overdue" }
  }
}

/* ---------- tipo de mídia ---------- */
type MediaPayload = { frontImageUri?: string } | null

export default function DeckScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [deckName, setDeckName] = React.useState<string>("")
  const [cards, setCards] = React.useState<CardWithDue[]>([])
  const [front, setFront] = React.useState("")
  const [back, setBack] = React.useState("")
  const [frontImageUri, setFrontImageUri] = React.useState<string | undefined>(
    undefined
  )

  const load = React.useCallback(async () => {
    const deck = await getDeck(id)
    setDeckName(deck?.name ?? "")
    const rows = await listCardsByDeck(id)
    setCards(rows)
  }, [id])

  React.useEffect(() => {
    load()
  }, [load])

  async function pickFrontImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso às fotos para anexar imagens."
      )
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    })
    if (!result.canceled && result.assets.length > 0) {
      setFrontImageUri(result.assets[0].uri)
    }
  }

  // app/deck/[id].tsx
  async function addCard() {
    console.log("addCard: Iniciando criação do card", {
      front: front.trim(),
      back: back.trim(),
      hasFrontImage: !!frontImageUri,
      deckId: id,
    })

    if (!front.trim() || !back.trim()) {
      console.log("addCard: Campos obrigatórios não preenchidos", {
        frontEmpty: !front.trim(),
        backEmpty: !back.trim(),
      })
      Alert.alert(
        "Campos obrigatórios",
        "Por favor, preencha tanto a frente quanto o verso do card.",
        [{ text: "OK" }]
      )
      return
    }

    const now = new Date().toISOString()
    const mediaPayload: MediaPayload = frontImageUri ? { frontImageUri } : null

    console.log("addCard: Preparando dados do card", {
      mediaPayload,
      timestamp: now,
    })

    try {
      console.log("addCard: Chamando createCard...")
      await createCard({
        id: String(uuid.v4()),
        deck_id: id,
        front: front.trim(),
        back: back.trim(),
        media: mediaPayload ? JSON.stringify(mediaPayload) : null,
        created_at: now,
        updated_at: now,
      })

      console.log("addCard: Card criado com sucesso")

      // Sucesso - mostra alert de confirmação
      Alert.alert(
        "Card criado!",
        "Seu novo card foi adicionado ao deck com sucesso.",
        [{ text: "OK" }]
      )

      console.log("addCard: Limpando formulário...")
      setFront("")
      setBack("")
      setFrontImageUri(undefined)

      console.log("addCard: Recarregando lista de cards...")
      await load()
      console.log("addCard: Lista de cards recarregada com sucesso")
    } catch (e: any) {
      console.error("addCard: Erro ao criar card", e)
      console.error("addCard: Detalhes do erro:", {
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
        deckId: id,
        frontText: front.trim(),
        backText: back.trim(),
      })

      // Erro - mostra alert com detalhes
      Alert.alert(
        "Erro ao criar card",
        `Não foi possível adicionar o card ao deck. Erro: ${
          e?.message || "Erro desconhecido"
        }`,
        [{ text: "OK" }]
      )
    }
  }

  async function removeCard(cardId: string) {
    await deleteCard(cardId)
    await load()
  }

  function confirmDeleteDeck() {
    Alert.alert(
      "Excluir deck",
      "Tem certeza que deseja excluir este deck e todos os seus cards?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteDeck(id)
            router.replace("/") // Home recarrega via useFocusEffect
          },
        },
      ],
      { cancelable: true }
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 12,
      }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Header com Voltar e Excluir deck */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#f8f8f8",
            }}
          >
            <Text style={{ fontSize: 16 }}>← Voltar</Text>
          </Pressable>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              flex: 1,
              textAlign: "center",
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {deckName}
          </Text>

          <Pressable
            onPress={confirmDeleteDeck}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fff5f5",
            }}
          >
            <Text style={{ fontSize: 14, color: "#c00", fontWeight: "600" }}>
              Excluir
            </Text>
          </Pressable>
        </View>

        {/* Formulário para novo card */}
        <View style={{ marginTop: 4 }}>
          <TextInput
            placeholder="Frente"
            value={front}
            onChangeText={setFront}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Button
              title={
                frontImageUri
                  ? "Trocar imagem (frente)"
                  : "Adicionar imagem (frente)"
              }
              onPress={pickFrontImage}
            />
            {frontImageUri && (
              <Button
                title="Remover"
                color="#c00"
                onPress={() => setFrontImageUri(undefined)}
              />
            )}
          </View>

          {frontImageUri && (
            <Image
              source={{ uri: frontImageUri }}
              style={{
                width: "100%",
                height: 160,
                borderRadius: 10,
                marginBottom: 8,
                backgroundColor: "#eee",
              }}
              contentFit="cover"
            />
          )}

          <TextInput
            placeholder="Verso"
            value={back}
            onChangeText={setBack}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />

          <Button title="Adicionar card" onPress={addCard} />
        </View>

        {/* Lista de cards */}
        <FlatList
          style={{ marginTop: 16 }}
          data={cards}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const label = formatDeckCooldownLabel(item.due_date, item.due_at)

            let media: MediaPayload = null
            try {
              media = item.media ? JSON.parse(item.media) : null
            } catch {}

            // 🔶 cor do texto do status: amarelo quando atrasado
            const statusColor =
              label.status === "overdue"
                ? "#f1c40f" // amarelo
                : label.status === "future"
                ? ColorGreen // verde
                : "#7f8c8d" // cinza

            return (
              <View
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 12,
                  backgroundColor: "white",
                }}
              >
                {media?.frontImageUri && (
                  <Image
                    source={{ uri: media.frontImageUri }}
                    style={{
                      width: "100%",
                      height: 140,
                      borderRadius: 8,
                      marginBottom: 8,
                      backgroundColor: "#eee",
                    }}
                    contentFit="cover"
                  />
                )}

                <Text style={{ fontWeight: "700" }}>{item.front}</Text>
                <Text style={{ opacity: 0.75, marginTop: 4 }}>{item.back}</Text>

                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 999,
                      backgroundColor: "#f2f3f4",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: statusColor }}>
                      {label.text}
                    </Text>
                  </View>
                </View>

                {/* botões: resetar e remover */}
                <View style={{ marginTop: 10, gap: 8 }}>
                  <Button
                    title="Resetar histórico"
                    onPress={async () => {
                      await resetCardScheduling(item.id)
                      await load()
                    }}
                  />
                  <Button
                    title="Excluir"
                    color="#c00"
                    onPress={() => {
                      Alert.alert("Excluir", "Excluir este card?", [
                        { text: "Cancelar" },
                        {
                          text: "Excluir",
                          style: "destructive",
                          onPress: async () => {
                            await removeCard(item.id)
                          },
                        },
                      ])
                    }}
                  />
                </View>
              </View>
            )
          }}
        />
      </View>
    </View>
  )
}
