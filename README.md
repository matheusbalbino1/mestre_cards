# Mestre Cards - Sistema de Repetição Espaçada

Um aplicativo móvel de flashcards inteligente que utiliza algoritmos de repetição espaçada (SRS) para otimizar o aprendizado e retenção de informações.

## 🎯 Visão Geral

Mestre Cards é uma aplicação React Native que implementa o algoritmo SM-2 (SuperMemo 2) para gerenciar o agendamento inteligente de revisões de flashcards. O sistema adapta-se automaticamente ao desempenho do usuário, apresentando cards no momento ideal para maximizar a retenção.

## 📱 Screenshots do App

<div align="center">
  <img src="assets/images/screenshots/home-screen.jpg" width="200" alt="Tela Principal"/>
  <img src="assets/images/screenshots/study-screen.jpg" width="200" alt="Tela de Estudo"/>
  <img src="assets/images/screenshots/deck-list.jpg" width="200" alt="Lista de Decks"/>
</div>

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios

```
mestre_cards/
├── app/                    # Páginas da aplicação (Expo Router)
├── components/             # Componentes reutilizáveis
├── lib/                    # Lógica de negócio e utilitários
│   ├── db/                # Camada de persistência (SQLite)
│   ├── srs/               # Algoritmos de repetição espaçada
│   └── utils/             # Utilitários auxiliares
├── hooks/                  # Hooks personalizados do React
└── constants/              # Constantes e configurações
```

### Padrões Arquiteturais

- **Separação de Responsabilidades**: Lógica de negócio separada da interface
- **Repository Pattern**: Abstração da camada de dados
- **Hook-based Architecture**: Gerenciamento de estado com hooks personalizados
- **TypeScript**: Tipagem estática para maior robustez

## 🛠️ Stack Tecnológica

### Frontend

- **React Native**: Framework para desenvolvimento mobile multiplataforma
- **Expo**: Plataforma para desenvolvimento e deploy de apps React Native
- **TypeScript**: Superset do JavaScript com tipagem estática
- **Tailwind CSS**: Framework CSS utilitário para estilização

### Backend & Persistência

- **SQLite**: Banco de dados local embutido
- **expo-sqlite**: Driver SQLite para Expo
- **Migrations**: Sistema de migrações para evolução do schema

### Estado & Gerenciamento

- **React Hooks**: useState, useEffect, useCallback para gerenciamento de estado
- **Context API**: Compartilhamento de estado entre componentes
- **Local Storage**: Persistência de configurações locais

## 🧠 Algoritmos de Repetição Espaçada

### Implementação do SM-2 (SuperMemo 2)

O algoritmo SM-2 é implementado no arquivo `lib/srs/sm2.ts` e gerencia o agendamento inteligente de revisões:

#### Estados do Card

```typescript
interface SRSState {
  repetitions: number // Repetições consecutivas corretas
  intervalDays: number // Intervalo em dias para revisões normais
  intervalMinutes: number // Intervalo em minutos para revisões rápidas
  ease: number // Fator de facilidade (1.3 - 3.0)
  dueDate: string // Data da próxima revisão
  lastReviewAt?: string // Timestamp da última revisão
  lapses?: number // Número de erros cometidos
}
```

#### Lógica de Agendamento

**Para Respostas Incorretas (Rating.Fail = 0):**

- Reset das repetições para 0
- Aplicação de intervalos progressivos:
  - 1ª falha: 30 minutos
  - 2ª falha: 2 horas
  - 3ª falha: 4 horas
  - 4ª+ falhas: 1 dia
- Redução do fator de facilidade (ease) em 0.2

**Para Respostas Corretas:**

- Incremento das repetições
- Cálculo do próximo intervalo baseado no número de repetições:
  - 0 repetições: 1 dia
  - 1 repetição: 6 dias
  - 2+ repetições: `intervalo_anterior × ease`
- Ajuste do fator de facilidade baseado na qualidade da resposta

#### Fórmulas Matemáticas

**Cálculo do Ease Factor:**

```typescript
ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```

Onde `q` é a qualidade da resposta convertida para escala SM-2:

- Hard (1) → q = 3
- Good (2) → q = 4
- Easy (3) → q = 5

**Cálculo do Intervalo:**

```typescript
if (repetitions === 0) {
  intervalDays = 1
} else if (repetitions === 1) {
  intervalDays = 6
} else {
  intervalDays = Math.max(1, Math.round(intervalDays * ease))
}
```

## 🗄️ Sistema de Banco de Dados

### Schema Principal

```sql
-- Tabela de Decks
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabela de Cards
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  media TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabela de Estado de Agendamento
CREATE TABLE scheduling_state (
  card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  repetitions INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  interval_minutes INTEGER DEFAULT 0,
  ease REAL DEFAULT 2.5,
  due_date TEXT,
  last_review_at TEXT,
  lapses INTEGER DEFAULT 0,
  due_at TEXT
);
```

### Sistema de Migrações

O projeto implementa um sistema de migrações versionado para evolução do schema:

- **v1**: Criação das tabelas base
- **v2**: Adição do campo `due_at` para timestamps precisos
- **v3**: Adição do campo `interval_minutes` para revisões rápidas

### Repository Pattern

A camada de dados é abstraída através de repositories especializados:

- `cards.repo.ts`: Operações CRUD para cards
- `decks.repo.ts`: Gerenciamento de decks
- `scheduling.repo.ts`: Lógica de agendamento e revisões

## 📱 Interface do Usuário

### Componentes Principais

- **StudyScreen**: Interface principal de estudo com cards
- **CardRow**: Exibição de cards em listas
- **HapticTab**: Navegação com feedback tátil
- **ThemedText/ThemedView**: Componentes com suporte a temas

### Fluxo de Estudo

1. **Carregamento**: Sistema busca cards vencidos baseado em `due_at`
2. **Apresentação**: Card é mostrado com opções de resposta
3. **Avaliação**: Usuário classifica a dificuldade (0-3)
4. **Processamento**: Algoritmo SM-2 calcula próximo agendamento
5. **Persistência**: Estado é salvo no banco SQLite

## 🔄 Sistema de Agendamento

### Cálculo de Disponibilidade

```typescript
export async function loadDueToday(deckId?: string): Promise<StudyItem[]> {
  const nowIso = new Date().toISOString()

  // Busca cards vencidos considerando intervalos em minutos e dias
  const rows = await db.getAllAsync(
    `
    SELECT c.*, s.*
    FROM cards c
    LEFT JOIN scheduling_state s ON s.card_id = c.id
    WHERE COALESCE(s.due_at, s.due_date || 'T00:00:00') <= ?
  `,
    nowIso
  )
}
```

### Lógica de Priorização

1. **Cards com `interval_minutes > 0`**: Prioridade alta (revisões rápidas)
2. **Cards com `interval_days > 0`**: Prioridade normal (revisões diárias)
3. **Cards novos**: Sem histórico de agendamento

## 🧪 Testes e Validação

### Script de Teste

O arquivo `scripts/test-intervals.js` valida:

- Comportamento do algoritmo SM-2 modificado
- Cálculo correto de intervalos em minutos
- Formatação de tempo para interface
- Cenários de falhas consecutivas

### Execução de Testes

```bash
node scripts/test-intervals.js
```

## 🚀 Deploy e Distribuição

### Configuração Expo

- **app.json**: Configurações da aplicação
- **eas.json**: Configurações de build e deploy
- **tailwind.config.js**: Configuração do Tailwind CSS

### Build

```bash
# Desenvolvimento
expo start

# Build para produção
eas build --platform android
eas build --platform ios
```

## 📊 Métricas e Analytics

### Dados Coletados

- **Repetições**: Número de acertos consecutivos
- **Lapses**: Número de erros cometidos
- **Ease Factor**: Fator de facilidade individual do card
- **Intervalos**: Tempo entre revisões (minutos/dias)

### Insights de Performance

- **Retenção**: Taxa de acertos por card
- **Dificuldade**: Cards que mais causam erros
- **Progresso**: Evolução do fator de facilidade

## 🔮 Roadmap e Melhorias

### Otimizações Técnicas

- [ ] Cache inteligente para cards frequentes
- [ ] Lazy loading de mídia
- [ ] Compressão de dados para economia de espaço
- [ ] Backup automático para nuvem

## 🤝 Contribuição

### Padrões de Código

- **TypeScript**: Uso obrigatório para novos arquivos
- **ESLint**: Configuração de linting automático
- **Prettier**: Formatação consistente de código
- **Commits**: Mensagens descritivas e em português

### Estrutura de Commits

```
feat: adiciona suporte a intervalos em minutos
fix: corrige cálculo de agendamento para cards com falha
docs: atualiza README com informações técnicas
refactor: reorganiza estrutura de componentes
```

## Download do APK

Você pode baixar o arquivo APK diretamente pelo link abaixo:

[Download do APK](https://expo.dev/artifacts/eas/sBxMLCA75buYo13pmWUNMa.apk)

## 📚 Referências Técnicas

- [SuperMemo Algorithm](https://super-memo.com/english/ol/sm2.htm)
- [Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 🎓 Desenvolvimento

Este projeto foi desenvolvido durante o **Vibe Coding**, uma iniciativa de desenvolvimento colaborativo e aprendizado em grupo. O Vibe Coding promove a criação de projetos práticos enquanto se aprende novas tecnologias e conceitos.

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e de aprendizado. Consulte o arquivo de licença para mais detalhes.

---

**Desenvolvido com ❤️ durante o Vibe Coding para otimizar o aprendizado através da tecnologia**
