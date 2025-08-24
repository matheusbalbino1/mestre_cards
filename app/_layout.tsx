import { ensureDBReady } from "@/lib/db"
import { Stack } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"
import { useEffect } from "react"
import { Alert } from "react-native"

export default function RootLayout() {
  useEffect(() => {
    async function setupDatabase() {
      try {
        console.log("Configurando banco de dados...")
        await ensureDBReady()
        console.log("Banco configurado com sucesso")
      } catch (error) {
        console.error("Erro ao configurar banco:", error)
        Alert.alert(
          "Erro de inicialização",
          "Não foi possível inicializar o banco de dados. Reinicie o app.",
          [{ text: "OK" }]
        )
      }
    }

    setupDatabase()
  }, [])

  return (
    <SQLiteProvider databaseName="mestre_cards.db">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  )
}
