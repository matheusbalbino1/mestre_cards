import { Stack } from "expo-router"
import { DBProvider } from "./contexts/DBContext"

export default function RootLayout() {
  return (
    <DBProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="splash"
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
      </Stack>
    </DBProvider>
  )
}
