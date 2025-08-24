// lib/db/config.ts
export const DB_CONFIG = {
  name: "mestre-cards.db",
  version: "1.0",
  description: "Banco de dados para o app Mestre Cards",
  size: 2000000, // 2MB
}

// Configurações SQLite otimizadas para performance
export const DB_PRAGMAS = [
  "PRAGMA journal_mode = WAL;",
  "PRAGMA synchronous = NORMAL;",
  "PRAGMA cache_size = 10000;",
  "PRAGMA temp_store = MEMORY;",
  "PRAGMA page_size = 4096;",
  "PRAGMA foreign_keys = ON;",
  "PRAGMA recursive_triggers = ON;",
]

// Configurações específicas para cada plataforma
export const PLATFORM_CONFIG = {
  android: {
    location: "default",
    enableSQLite: true,
  },
  ios: {
    location: "default",
    enableSQLite: true,
  },
  web: {
    location: "default",
    enableSQLite: true,
  },
}
