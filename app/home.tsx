// app/index.tsx
import { ColorGreen } from "@/constants/Colors"
import { Href, router, useFocusEffect } from "expo-router"
import React from "react"
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import uuid from "react-native-uuid"
import {
  createDeck,
  listDecksWithStats,
  type DeckStats,
} from "../lib/db/decks.repo"
import { formatDueLabel } from "../lib/utils/time"

function labelDisponiveis(n: number) {
  return n === 1 ? "1 card disponível" : `${n} cards disponíveis`
}

function timeHMUntil(iso: string): string {
  const target = new Date(iso).getTime()
  const now = Date.now()
  const ms = Math.max(0, target - now)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const hLabel = h > 0 ? `${h}h` : ""
  const mLabel = `${m}m`
  const sep = h > 0 ? " " : ""
  return `${hLabel}${sep}${mLabel}`.trim()
}

export default function HomeDecks() {
  const insets = useSafeAreaInsets()

  const [decks, setDecks] = React.useState<DeckStats[]>([])
  const [loading, setLoading] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [deckName, setDeckName] = React.useState("")
  const [deckDescription, setDeckDescription] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    const rows = await listDecksWithStats().catch(() => [])
    setDecks(rows)
    setLoading(false)
  }, [])

  async function handleCreateDeck() {
    const name = deckName.trim()
    if (!name) return

    const now = new Date().toISOString()
    try {
      await createDeck({
        id: String(uuid.v4()),
        name,
        description: deckDescription.trim() || null,
        tags: null,
        created_at: now,
        updated_at: now,
      })
      setCreateOpen(false)
      setDeckName("")
      setDeckDescription("")
      await load()
    } catch (e) {
      console.error("Erro ao criar deck:", e)
      const message = e instanceof Error ? e.message : "Erro desconhecido"
      Alert.alert("Erro ao criar deck:", message)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      load()
    }, [load])
  )

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: insets.top + 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "600" }}>Meus Decks</Text>
        <Button title="Novo" onPress={() => setCreateOpen(true)} />
      </View>

      {/* Lista */}
      <FlatList
        style={{ marginTop: 16 }}
        data={decks}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => {
          let subtitle = "Sem cards"
          let subtitleColor = "#7f8c8d"
          let hasCardAvailiable = false

          if (item.total_cards > 0) {
            if (item.due_now > 0) {
              hasCardAvailiable = true
              subtitle = labelDisponiveis(item.due_now)
              subtitleColor = ColorGreen
            } else if (item.next_due_at || item.next_due_date) {
              const due = formatDueLabel(
                item.next_due_date,
                new Date(),
                item.next_due_at
              )
              if (item.next_due_at) {
                hasCardAvailiable = false
                const isSameDay =
                  new Date(item.next_due_at).toISOString().slice(0, 10) ===
                  new Date().toISOString().slice(0, 10)
                if (isSameDay) {
                  const hm = timeHMUntil(item.next_due_at)
                  subtitle = `Próximo card disponível em ${hm}`
                  subtitleColor = "#f39c12"
                } else {
                  const texto = due.text.startsWith("falta ")
                    ? due.text.replace("falta ", "")
                    : due.text
                  subtitle = `Próximo card disponível em ${texto}`
                  subtitleColor = ColorGreen
                }
              } else {
                hasCardAvailiable = false
                const texto = due.text.startsWith("falta ")
                  ? due.text.replace("falta ", "")
                  : due.text
                subtitle = `Próximo card disponível em ${texto}`
                subtitleColor = ColorGreen
              }
            }
          }

          return (
            <View>
              <Pressable
                onPress={() => router.push(`/deck/${item.id}`)}
                style={{
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: "12px 12px 0 0",
                  backgroundColor: "white",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {item.name}
                </Text>
                {!!item.description && (
                  <Text style={{ opacity: 0.7, marginTop: 4 }}>
                    {item.description}
                  </Text>
                )}

                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: subtitleColor }}>{subtitle}</Text>
                  <Text style={{ opacity: 0.6 }}>{item.total_cards} cards</Text>
                </View>
              </Pressable>
              {hasCardAvailiable && (
                <View
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    borderRadius: "0 0 12px 12px",
                  }}
                >
                  <Button
                    title="Estudar"
                    color={ColorGreen}
                    onPress={() => {
                      const href: Href = {
                        pathname: "/study",
                        params: { deck: item.id as string },
                      }
                      router.push(href)
                    }}
                  />
                </View>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ marginTop: 24, opacity: 0.7 }}>
              Toque em “NOVO” para criar seu primeiro deck.
            </Text>
          ) : null
        }
      />

      {/* Modal: criar deck */}
      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "white",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Criar deck</Text>
            <Text style={{ marginTop: 6, opacity: 0.7 }}>
              Digite o nome do deck:
            </Text>

            <TextInput
              placeholder="Exemplo: Inglês — Verbos"
              value={deckName}
              onChangeText={setDeckName}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 12,
              }}
            />

            <Text style={{ marginTop: 16, opacity: 0.7 }}>
              Descrição (opcional):
            </Text>

            <TextInput
              placeholder="Exemplo: Verbos irregulares em inglês para iniciantes"
              value={deckDescription}
              onChangeText={setDeckDescription}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 8,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setCreateOpen(false)
                  setDeckName("")
                  setDeckDescription("")
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#ddd",
                }}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateDeck}
                disabled={!deckName.trim()}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: deckName.trim() ? "#007AFF" : "#a8c5ff",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
