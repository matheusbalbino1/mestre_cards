# Troubleshooting - Problemas de Banco de Dados

## Erro: "no such table: decks"

Este erro indica que a tabela `decks` não foi criada corretamente durante a inicialização do banco.

### Soluções:

#### 1. Reset do Banco de Dados (Recomendado)

```bash
npm run reset-db
```

Este comando remove o banco corrompido e permite que seja recriado na próxima execução.

#### 2. Verificar Logs

Execute o app e verifique os logs no console para identificar onde está o problema:

- Procure por mensagens de erro nas migrações
- Verifique se as tabelas estão sendo criadas
- Confirme se o banco está sendo aberto corretamente

#### 3. Problemas Comuns

**Versão do expo-sqlite incompatível:**

- Verifique se está usando `expo-sqlite` ~15.2.14
- Atualize se necessário: `npx expo install expo-sqlite`

**Banco corrompido:**

- O banco pode ter sido corrompido durante uma migração
- Use `npm run reset-db` para limpar

**Problemas de permissão:**

- Em alguns dispositivos, o app pode não ter permissão para criar arquivos
- Tente reinstalar o app

#### 4. Debug Manual

Se o problema persistir, você pode:

1. Adicionar mais logs no arquivo `lib/db/migrations.ts`
2. Verificar se o arquivo `lib/db/test.ts` está funcionando
3. Testar as migrações individualmente

#### 5. Estrutura Esperada

Após a inicialização, o banco deve conter:

- Tabela `__meta` (controle de versão)
- Tabela `decks` (baralhos)
- Tabela `cards` (cartas)
- Tabela `scheduling_state` (estado de revisão)

### Logs Úteis

Procure por estas mensagens no console:

```
✅ Banco aberto
✅ Migrações aplicadas
✅ Tabelas verificadas
✅ Query executada
```

Se alguma dessas mensagens não aparecer, o problema está naquela etapa específica.
