#!/usr/bin/env node

/**
 * Script para resetar o banco de dados do app
 * Útil quando há problemas de migração ou tabelas corrompidas
 */

const fs = require("fs")
const path = require("path")

// Caminhos onde o banco pode estar armazenado
const possiblePaths = [
  // Android
  path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".expo",
    "android",
    "mestre-cards.db"
  ),
  // iOS
  path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".expo",
    "ios",
    "mestre-cards.db"
  ),
  // Web
  path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".expo",
    "web",
    "mestre-cards.db"
  ),
  // Expo Go
  path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".expo",
    "mestre-cards.db"
  ),
]

console.log("🔍 Procurando por arquivos de banco de dados...")

let foundFiles = []

possiblePaths.forEach((dbPath) => {
  if (fs.existsSync(dbPath)) {
    foundFiles.push(dbPath)
    console.log(`✅ Encontrado: ${dbPath}`)
  }
})

if (foundFiles.length === 0) {
  console.log("❌ Nenhum arquivo de banco encontrado")
  console.log("💡 Tente executar o app primeiro para criar o banco")
  process.exit(0)
}

console.log("\n🗑️  Removendo arquivos de banco encontrados...")

foundFiles.forEach((file) => {
  try {
    fs.unlinkSync(file)
    console.log(`✅ Removido: ${file}`)
  } catch (error) {
    console.error(`❌ Erro ao remover ${file}:`, error.message)
  }
})

console.log("\n✨ Banco de dados resetado com sucesso!")
console.log("💡 Execute o app novamente para recriar o banco")
