import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { ensureDBReady } from "../lib/db"

export default function AppEntry() {
  const [dbReady, setDbReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDB = async () => {
      try {
        console.log("Inicializando banco de dados...")
        await ensureDBReady()
        console.log("Banco de dados inicializado com sucesso")
        setDbReady(true)
      } catch (err) {
        console.error("Erro ao inicializar banco:", err)
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      }
    }

    initDB()
  }, [])

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Erro ao inicializar: {error}</Text>
      </View>
    )
  }

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Inicializando...</Text>
      </View>
    )
  }

  return <Redirect href={"/splash" as any} />
}
