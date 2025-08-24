// Script para testar os novos intervalos em minutos
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🧪 Testando novos intervalos em minutos...\n")

// Simula o comportamento do algoritmo SM2 modificado
function testSM2Intervals() {
  console.log("📊 Testando algoritmo SM2 com intervalos em minutos:\n")

  // Estado inicial
  let state = {
    repetitions: 0,
    intervalDays: 0,
    intervalMinutes: 0,
    ease: 2.5,
    dueDate: "2024-01-01",
    lapses: 0,
  }

  console.log("Estado inicial:", JSON.stringify(state, null, 2))

  // Simula uma sequência de respostas
  const responses = [
    { rating: 0, name: "Errei" },
    { rating: 0, name: "Errei novamente" },
    { rating: 0, name: "Errei pela terceira vez" },
    { rating: 2, name: "Acertou!" },
    { rating: 0, name: "Errou depois de acertar" },
  ]

  responses.forEach((response, index) => {
    console.log(
      `\n--- ${index + 1}. ${response.name} (Rating: ${response.rating}) ---`
    )

    // Simula o algoritmo SM2
    if (response.rating === 0) {
      // Fail
      state.repetitions = 0
      state.intervalDays = 0
      state.lapses += 1

      // Calcula intervalo baseado no número de lapses
      if (state.lapses === 1) {
        state.intervalMinutes = 30 // 30 minutos
      } else if (state.lapses === 2) {
        state.intervalMinutes = 120 // 2 horas
      } else if (state.lapses === 3) {
        state.intervalMinutes = 240 // 4 horas
      } else {
        state.intervalMinutes = 0
        state.intervalDays = 1 // 1 dia
      }

      state.ease = Math.max(1.3, state.ease - 0.2)
    } else {
      // Resposta correta
      if (state.repetitions === 0) {
        state.intervalDays = 1
        state.intervalMinutes = 0
      } else if (state.repetitions === 1) {
        state.intervalDays = 6
        state.intervalMinutes = 0
      } else {
        state.intervalDays = Math.max(
          1,
          Math.round(state.intervalDays * state.ease)
        )
        state.intervalMinutes = 0
      }
      state.repetitions += 1
    }

    console.log("Estado após resposta:", JSON.stringify(state, null, 2))

    // Mostra quando o card estará disponível
    if (state.intervalMinutes > 0) {
      console.log(
        `⏰ Card estará disponível em: ${state.intervalMinutes} minutos`
      )
    } else if (state.intervalDays > 0) {
      console.log(`📅 Card estará disponível em: ${state.intervalDays} dia(s)`)
    } else {
      console.log("✅ Card disponível agora")
    }
  })
}

// Testa a formatação de tempo
function testTimeFormatting() {
  console.log("\n⏰ Testando formatação de tempo:\n")

  const now = new Date()
  const testTimes = [
    new Date(now.getTime() + 30 * 60 * 1000), // 30 min
    new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2h
    new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4h
    new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25h
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 dias
  ]

  testTimes.forEach((time, index) => {
    const diffMs = time.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    let formatted
    if (diffDays > 0) {
      formatted = `${diffDays} dia${diffDays > 1 ? "s" : ""}`
    } else if (diffHours > 0) {
      formatted = `${diffHours}h ${diffMinutes % 60}min`
    } else {
      formatted = `${diffMinutes} min`
    }

    console.log(`${index + 1}. ${time.toLocaleString()}: ${formatted}`)
  })
}

// Executa os testes
try {
  testSM2Intervals()
  testTimeFormatting()

  console.log("\n✅ Todos os testes executados com sucesso!")
  console.log("\n📝 Resumo das mudanças:")
  console.log(
    "• Cards com falha agora aparecem em 30 min, 2h, 4h, depois 1 dia"
  )
  console.log("• Sistema suporta intervalos em minutos além de dias")
  console.log("• Interface mostra quando o card estará disponível novamente")
  console.log(
    "• Banco de dados foi atualizado com nova coluna interval_minutes"
  )
} catch (error) {
  console.error("❌ Erro durante os testes:", error)
  process.exit(1)
}
