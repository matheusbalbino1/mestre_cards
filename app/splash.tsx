// app/splash.tsx
import { checkTablesExist, ensureDBReady } from "@/lib/db"
import { router } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import React, { useEffect } from "react"
import { ActivityIndicator, Alert, Text, View } from "react-native"

SplashScreen.preventAutoHideAsync() // Impede que o splash padrão feche antes da hora

export default function Splash() {
  useEffect(() => {
    ;(async () => {
      try {
        Alert.alert("🚀 Splash", "Iniciando preparação do banco...")
        await ensureDBReady() // << aguarda migrations e abertura
        Alert.alert("✅ Splash", "Banco preparado")

        // Verifica se as tabelas existem
        const tablesExist = await checkTablesExist()
        if (tablesExist) {
          Alert.alert("✅ Splash", "Tabelas verificadas, redirecionando...")
        } else {
          Alert.alert("❌ Splash", "Tabelas não existem após preparação")
        }
      } catch (e) {
        Alert.alert("💥 Splash", `Erro na inicialização do banco: ${e}`)
        // Em caso de erro, ainda tenta continuar para não travar o app
      } finally {
        await SplashScreen.hideAsync()
        router.replace("/") // entra na Home só depois do DB pronto
      }
    })()
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#333" }}>
        Mestre Cards
      </Text>

      <Text style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
        Desenvolvido por MatheusBalbino1
      </Text>

      <ActivityIndicator
        size="large"
        color="#007AFF"
        style={{ marginTop: 24 }}
      />
    </View>
  )
}
