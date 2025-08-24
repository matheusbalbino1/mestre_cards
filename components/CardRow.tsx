import React from "react"
import { Text, View } from "react-native"

export function CardRow({ front, back }: { front: string; back: string }) {
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
      <Text style={{ fontWeight: "600" }}>{front}</Text>
      <Text style={{ opacity: 0.7, marginTop: 4 }}>{back}</Text>
    </View>
  )
}
