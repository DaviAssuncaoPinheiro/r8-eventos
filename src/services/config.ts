/*
  Latência simulada e modo de falha das chamadas.
  Testes: setLatency(0, 0) zera a espera; failNext() faz a próxima chamada rejeitar sem mudar o estado.
  Demonstração de erro ao vivo: setFailureRate(0.3).
*/

export class ServiceError extends Error {
  constructor(message: string = 'Não foi possível concluir. Tente de novo.') {
    super(message)
    this.name = 'ServiceError'
  }
}

let innerDepth = 0
let latencyMin = 200
let latencyMax = 600
let failureRate = 0
let failQueue = 0

/** Espera simulada de cada chamada, em ms (sorteada entre min e max) */
export function setLatency(min: number, max: number = min): void {
  latencyMin = Math.max(0, min)
  latencyMax = Math.max(latencyMin, max)
}

/** Chance (0 a 1) de qualquer chamada falhar. Padrão 0. */
export function setFailureRate(rate: number): void {
  failureRate = Math.min(1, Math.max(0, rate))
}

/** Faz as próximas `n` chamadas (padrão 1) rejeitarem com ServiceError */
export function failNext(n: number = 1): void {
  failQueue = Math.max(0, n)
}

export function getFailureRate(): number {
  return failureRate
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Toda função de serviço passa por aqui: espera, decide a falha ANTES de tocar no estado e só então executa.
 * Erros de regra de negócio (ServiceError lançado dentro de fn) também rejeitam, sem alterar nada
 * (as mutações montam o resultado e gravam uma vez, no fim).
 */
export async function call<T>(fn: () => T | Promise<T>): Promise<T> {
  if (innerDepth > 0) return await fn()
  const wait = latencyMax <= 0 ? 0 : latencyMin + Math.random() * (latencyMax - latencyMin)
  if (wait > 0) await sleep(wait)
  if (failQueue > 0) {
    failQueue--
    throw new ServiceError()
  }
  if (failureRate > 0 && Math.random() < failureRate) throw new ServiceError()
  return await fn()
}

/**
 * Uso interno: executa várias chamadas de serviço em sequência como UMA só (sem somar latência
 * nem sortear falha de novo). Usado pelo copiloto ao aprovar uma sugestão.
 */
export async function inner<T>(fn: () => Promise<T>): Promise<T> {
  innerDepth++
  try {
    return await fn()
  } finally {
    innerDepth--
  }
}
