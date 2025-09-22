// app/splash.tsx
import { DatabaseStatus } from "@/lib/db"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Image, Text, View } from "react-native" // para permitir que o Expo gerencie a splash screen nativa
import { useDB } from "./contexts/DBContext"

export default function Splash() {
  const { databaseStatus$ } = useDB()

  const [status, setStatus] = useState<DatabaseStatus>(
    DatabaseStatus.INITIALIZING
  )

  useEffect(() => {
    const subscription = databaseStatus$.subscribe((statusdB) => {
      setStatus(statusdB)
      if (statusdB === DatabaseStatus.INITIALIZED) {
        router.replace("/home" as any)
      }
    })

    return () => subscription.unsubscribe()
  }, [databaseStatus$])

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
      <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 150, height: 150, marginBottom: 24, borderRadius: 12 }}
      />

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

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginTop: 16,
          textAlign: "center",
          opacity: 0.8,
        }}
      >
        {status}
      </Text>
    </View>
  )
}
