# 🔧 Solução para Erro "no such table: decks"

## 🚨 Problema Identificado

O erro "Call to function 'NativeDatabase.prepareAsync' error code \u0001 no such table: decks" indica que a tabela `decks` não foi criada durante a inicialização do banco.

## 🛠️ Soluções Implementadas

### 1. **Reset do Banco (RECOMENDADO)**

```bash
npm run reset-db
```

Este comando remove o banco corrompido e permite recriação.

### 2. **Alertas Visuais (NO APP)**

Adicionei alertas visuais em todos os arquivos de banco para identificar onde está falhando:

- `lib/db/migrations.ts` - Alertas nas migrações
- `lib/db/index.ts` - Alertas na inicialização
- `app/splash.tsx` - Alertas na tela de splash

### 3. **Verificação de Tabelas**

Implementei verificação automática se as tabelas foram criadas corretamente.

## 🔍 Como Debuggar

### **Execute o app e você verá alertas em cada etapa:**

**Alertas esperados (em ordem):**

1. **🗄️ Banco** - "Abrindo banco de dados..."
2. **✅ Sucesso** - "Banco de dados aberto com sucesso"
3. **⚡ Configuração** - "Modo WAL configurado"
4. **🚀 Preparação** - "Iniciando preparação do banco de dados..."
5. **📋 Migrações** - "Aplicando migrações..."
6. **🚀 Migrações** - "Iniciando aplicação de migrações..."
7. **🔍 Verificação** - "Verificando versão atual do banco..."
8. **🆕 Inicialização** - "Inicializando versão do banco para 0"
9. **📊 Versão** - "Versão atual do banco: 0"
10. **📈 Status** - "Versão atual: 0, Versão alvo: 2"
11. **🔄 Execução** - "Executando migração 1/2..."
12. **🔧 Migração v1** - "Executando migração v1: criando tabelas base..."
13. **✅ Sucesso** - "Migração v1 executada com sucesso"
14. **🔄 Atualização** - "Atualizando versão do banco para 1"
15. **✅ Sucesso** - "Migração 1 executada com sucesso"
16. **🔄 Execução** - "Executando migração 2/2..."
17. **🔧 Migração v2** - "Executando migração v2: adicionando due_at..."
18. **✅ Sucesso** - "Migração v2 executada com sucesso"
19. **🔄 Atualização** - "Atualizando versão do banco para 2"
20. **✅ Sucesso** - "Migração 2 executada com sucesso"
21. **🎉 Concluído** - "Todas as migrações foram aplicadas com sucesso"
22. **🔍 Verificação** - "Tabela 'decks' existe: true"
23. **✅ Concluído** - "Banco de dados preparado com sucesso"
24. **🚀 Splash** - "Iniciando preparação do banco..."
25. **✅ Splash** - "Banco preparado"
26. **✅ Splash** - "Tabelas verificadas, redirecionando..."

### **Se algum alerta não aparecer, o problema está naquela etapa:**

- ❌ **"Banco aberto" não aparece** → Problema na abertura do banco
- ❌ **"Migrações aplicadas" não aparece** → Problema nas migrações
- ❌ **"Tabela 'decks' existe: true" não aparece** → Tabelas não foram criadas

## 🚀 Passos para Resolver

### **Passo 1: Reset do Banco**

```bash
npm run reset-db
```

### **Passo 2: Reinstalar o App**

- Pare o app
- Execute `npm start` novamente
- **Observe os alertas que aparecem no app**

### **Passo 3: Se o Problema Persistir**

1. Verifique se está usando `expo-sqlite` ~15.2.14
2. Atualize: `npx expo install expo-sqlite`
3. Limpe cache: `npx expo start --clear`

## 🔧 Arquivos Modificados

- ✅ `lib/db/migrations.ts` - Alertas e tratamento de erros
- ✅ `lib/db/index.ts` - Verificação de tabelas com alertas
- ✅ `app/splash.tsx` - Alertas na inicialização
- ✅ `lib/db/test.ts` - Sistema de teste com alertas
- ✅ `lib/db/seed.ts` - Alertas no seed
- ✅ `scripts/reset-db.js` - Script de reset
- ✅ `package.json` - Script adicionado

## 📱 Teste Manual

Se quiser testar manualmente, execute no console:

```javascript
import { testDatabase } from "@/lib/db/test"
await testDatabase()
```

## 🆘 Se Nada Funcionar

1. **Reinstale o app completamente**
2. **Verifique permissões do dispositivo**
3. **Teste em outro dispositivo/emulador**
4. **Verifique se há conflitos de versão do Expo**

---

**💡 Dica:** Agora você verá exatamente onde está o problema através dos alertas no app!
