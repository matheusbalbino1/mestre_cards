# 🗄️ Configuração do SQLite para Mestre Cards

## ✅ **Configurações Já Implementadas**

### 1. **Plugin expo-sqlite**

- ✅ Adicionado ao `app.json`
- ✅ Configurado com `enableSQLite: true`

### 2. **Configurações de Banco**

- ✅ Nome: `mestre-cards.db`
- ✅ Tamanho: 2MB
- ✅ Localização: Padrão da plataforma

### 3. **Configurações de Performance**

- ✅ Modo WAL (Write-Ahead Logging)
- ✅ Cache otimizado
- ✅ Chaves estrangeiras habilitadas
- ✅ Triggers recursivos habilitados

## 🔧 **O que Foi Configurado**

### **app.json**

```json
[
  "expo-sqlite",
  {
    "enableSQLite": true
  }
]
```

### **lib/db/config.ts**

```typescript
export const DB_PRAGMAS = [
  "PRAGMA journal_mode = WAL;",
  "PRAGMA synchronous = NORMAL;",
  "PRAGMA cache_size = 10000;",
  "PRAGMA temp_store = MEMORY;",
  "PRAGMA page_size = 4096;",
  "PRAGMA foreign_keys = ON;",
  "PRAGMA recursive_triggers = ON;",
]
```

## 🚀 **Como Testar**

### **1. Reset do Banco**

```bash
npm run reset-db
```

### **2. Execute o App**

- Você verá alertas em cada etapa
- O SQLite será configurado automaticamente
- As migrações serão executadas

### **3. Alertas Esperados**

1. 🗄️ **Banco** - "Abrindo banco de dados..."
2. ✅ **Sucesso** - "Banco de dados aberto com sucesso"
3. ⚡ **Configuração** - "Configurações SQLite aplicadas"
4. 🔧 **Migração v1** - "Executando migração v1: criando tabelas base..."
5. 🔍 **Verificação** - "Tabela 'decks' existe: true"

## 📱 **Plataformas Suportadas**

- ✅ **Android** - SQLite nativo
- ✅ **iOS** - SQLite nativo
- ✅ **Web** - SQLite via WebAssembly

## 🔍 **Verificações Importantes**

### **1. Versão do expo-sqlite**

```bash
npm list expo-sqlite
```

Deve ser `~15.2.14`

### **2. Plugin no app.json**

Deve conter:

```json
"expo-sqlite"
```

### **3. Permissões**

- Android: Permissões de armazenamento
- iOS: Sem permissões especiais necessárias

## 🆘 **Se Ainda Não Funcionar**

### **1. Limpe Cache**

```bash
npx expo start --clear
```

### **2. Reinstale Dependências**

```bash
rm -rf node_modules
npm install
```

### **3. Verifique Versão do Expo**

```bash
npx expo --version
```

Deve ser compatível com expo-sqlite ~15.2.14

### **4. Teste em Outro Dispositivo**

- Emulador Android
- Simulador iOS
- Navegador web

## 💡 **Dicas Importantes**

1. **Sempre execute `npm run reset-db`** antes de testar
2. **Observe os alertas** - eles mostram exatamente onde está o problema
3. **O SQLite é configurado automaticamente** - não precisa de configuração manual
4. **As migrações criam as tabelas** - aguarde todos os alertas

---

**🎯 O SQLite está configurado corretamente! Execute `npm run reset-db` e teste novamente.**
