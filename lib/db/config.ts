// lib/db/config.ts
export const DB_CONFIG = {
  name: "mestre-cards.db",
  version: "1.0",
  description: "Banco de dados para o app Mestre Cards",
  size: 2000000, // 2MB
}

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
