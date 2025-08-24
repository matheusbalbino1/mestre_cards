import { Alert } from "react-native"
import { getDB } from "./index"
import { applyMigrations } from "./migrations"

export async function testDatabase() {
  try {
    Alert.alert("🧪 Teste", "=== TESTE DO BANCO DE DADOS ===")

    // 1. Abrir banco
    Alert.alert("1️⃣ Banco", "Abrindo banco...")
    const db = await getDB()
    Alert.alert("✅ Banco", "Banco aberto")

    // 2. Aplicar migrações
    Alert.alert("2️⃣ Migrações", "Aplicando migrações...")
    await applyMigrations(db)
    Alert.alert("✅ Migrações", "Migrações aplicadas")

    // 3. Testar query simples
    Alert.alert("3️⃣ Query", "Testando query...")
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM decks"
    )
    Alert.alert("✅ Query", `Query executada: ${JSON.stringify(result)}`)

    Alert.alert("🎉 Sucesso", "=== TESTE CONCLUÍDO COM SUCESSO ===")
    return true
  } catch (error) {
    Alert.alert("💥 Erro", `=== ERRO NO TESTE ===\n${error}`)
    return false
  }
}
