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
import { Button as ButtonRNP } from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import uuid from "react-native-uuid"
import {
  createCard,
  deleteCard,
  listCardsByDeck,
  type CardWithDue,
} from "../../lib/db/cards.repo"
import { deleteDeck, getDeck } from "../../lib/db/decks.repo"
import {
  resetAllCardsScheduling,
  resetCardScheduling,
} from "../../lib/db/scheduling.repo"

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
  const [isResetting, setIsResetting] = React.useState(false)

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
      aspect: [1, 1], // Força proporção 1:1 (quadrado)
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

    // Validação: frente é obrigatória apenas se não houver imagem, verso sempre obrigatório
    if ((!front.trim() && !frontImageUri) || !back.trim()) {
      console.log("addCard: Campos obrigatórios não preenchidos", {
        frontEmpty: !front.trim(),
        hasImage: !!frontImageUri,
        backEmpty: !back.trim(),
      })

      let message = "Por favor, preencha:"
      if (!front.trim() && !frontImageUri)
        message += "\n• A frente do card (texto ou imagem)"
      if (!back.trim()) message += "\n• O verso do card"

      Alert.alert("Campos obrigatórios", message, [{ text: "OK" }])
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
        <View style={{ marginTop: 4, marginBottom: 24 }}>
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
            <ButtonRNP
              onPress={pickFrontImage}
              mode="outlined"
              labelStyle={{ color: "#9b9b9b" }}
              style={{
                borderColor: "#9b9b9b",
                borderWidth: 1,
                borderRadius: 4,
                borderStyle: "dashed",
              }}
            >
              {frontImageUri
                ? "TROCAR IMAGEM"
                : "CLIQUE AQUI PARA ADICIONAR IMAGEM"}
            </ButtonRNP>

            {frontImageUri && (
              <ButtonRNP
                onPress={() => setFrontImageUri(undefined)}
                mode="outlined"
                labelStyle={{ color: "#c00" }}
                style={{
                  borderColor: "#c00",
                  borderWidth: 1,
                  borderRadius: 4,
                }}
              >
                REMOVER
              </ButtonRNP>
            )}
          </View>

          {frontImageUri && (
            <Image
              source={{ uri: frontImageUri }}
              style={{
                width: 150,
                aspectRatio: 1,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: "#eee",
                resizeMode: "contain",
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

          <Button title="Adicionar card" onPress={addCard} color={ColorGreen} />

          {/* Botão Resetar todos - só aparece se existirem cards */}
          {cards.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Button
                title={isResetting ? "Resetando..." : "Resetar todos"}
                disabled={isResetting}
                onPress={() => {
                  Alert.alert(
                    "Resetar todos os cards?",
                    "Isso irá resetar o histórico de estudo de todos os cards deste deck. Eles voltarão a aparecer como novos para estudo.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Resetar todos",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            setIsResetting(true)
                            await resetAllCardsScheduling(id)

                            // Força refresh completo dos dados
                            await load()

                            // Pequeno delay para garantir que os dados foram atualizados
                            await new Promise((resolve) =>
                              setTimeout(resolve, 100)
                            )

                            Alert.alert(
                              "Sucesso!",
                              "Todos os cards foram resetados com sucesso.",
                              [{ text: "OK" }]
                            )
                          } catch (error) {
                            console.error("Erro ao resetar cards:", error)
                            Alert.alert(
                              "Erro",
                              "Não foi possível resetar os cards. Tente novamente.",
                              [{ text: "OK" }]
                            )
                          } finally {
                            setIsResetting(false)
                          }
                        },
                      },
                    ]
                  )
                }}
                color="#f39c12"
              />
            </View>
          )}
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
                      width: 80,
                      aspectRatio: 1,
                      borderRadius: 12,
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
                    onPress={() => {
                      Alert.alert(
                        "Resetar histórico?",
                        `Isso irá resetar o histórico de estudo do card "${item.front}>${item.back}". Ele voltará a aparecer como novo para estudo.`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Resetar",
                            style: "destructive",
                            onPress: async () => {
                              await resetCardScheduling(item.id)
                              await load()
                            },
                          },
                        ]
                      )
                    }}
                  />

                  <ButtonRNP
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
                    mode="outlined"
                    labelStyle={{ color: "#c00" }}
                    style={{
                      borderColor: "#c00",
                      borderWidth: 1,
                      borderRadius: 4,
                    }}
                  >
                    EXCLUIR
                  </ButtonRNP>
                </View>
              </View>
            )
          }}
        />
      </View>
    </View>
  )
}
