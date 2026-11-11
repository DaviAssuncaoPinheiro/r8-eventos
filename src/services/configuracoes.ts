/* Configurações: empresa, marca, segmento, copiloto, usuários, integrações e reinício da demonstração. */
import { commit, getData, newIds, resetDemo as resetDb } from '@/data/db'
import { demoNowISO } from '@/domain/dates'
import type { Company, IntegrationKey, SegmentId, Settings, User } from '@/domain/types'
import { SEGMENTS } from '@/domain/segments'
import { call, ServiceError } from './config'

export function getSettings(): Promise<Settings> {
  return call(() => getData().settings)
}

export function updateCompany(patch: Partial<Company>): Promise<Settings> {
  return call(() => {
    const data = getData()
    if (patch.name !== undefined && !patch.name.trim()) throw new ServiceError('Informe o nome da empresa.')
    commit({ settings: { ...data.settings, company: { ...data.settings.company, ...patch } } })
    return getData().settings
  })
}

/** Cor da marca (#rrggbb) e logotipo (data URL pequena). `null` remove o logotipo; omitido mantém. */
export function setBrand(hex: string, logoDataUrl?: string | null): Promise<Settings> {
  return call(() => {
    const data = getData()
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new ServiceError('Cor inválida. Use o formato #f04e0a.')
    const logo = logoDataUrl === null ? undefined : logoDataUrl ?? data.settings.logoDataUrl
    commit({ settings: { ...data.settings, brandHex: hex.toLowerCase(), logoDataUrl: logo } })
    return getData().settings
  })
}

/** Troca o pacote de segmento (rótulos, campos da ficha, checklists). Os dados continuam os mesmos. */
export function setSegment(id: SegmentId): Promise<Settings> {
  return call(() => {
    const data = getData()
    if (!SEGMENTS[id]) throw new ServiceError('Segmento desconhecido.')
    commit({ settings: { ...data.settings, segmentId: id } })
    return getData().settings
  })
}

export function setAiEnabled(enabled: boolean): Promise<Settings> {
  return call(() => {
    const data = getData()
    commit({ settings: { ...data.settings, aiEnabled: enabled } })
    return getData().settings
  })
}

export function listUsers(): Promise<User[]> {
  return call(() => getData().settings.users)
}

/** Cria (sem id) ou atualiza (com id) um usuário */
export function saveUser(input: Omit<User, 'id' | 'initials'> & { id?: string; initials?: string }): Promise<User> {
  return call(() => {
    const data = getData()
    if (!input.name.trim()) throw new ServiceError('Informe o nome do usuário.')
    if (!/.+@.+\..+/.test(input.email)) throw new ServiceError('E-mail inválido.')
    const ids = newIds()
    const initials = input.initials ?? input.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
    const user: User = { ...input, id: input.id ?? ids.next('usr'), initials }
    const exists = data.settings.users.some((u) => u.id === user.id)
    if (exists && data.settings.users.filter((u) => u.role === 'dono').length === 1 && data.settings.users.find((u) => u.id === user.id)?.role === 'dono' && user.role !== 'dono') throw new ServiceError('Precisa existir pelo menos um dono.')
    const users = exists ? data.settings.users.map((u) => (u.id === user.id ? user : u)) : [...data.settings.users, user]
    commit({ settings: { ...data.settings, users }, seq: ids.seq() })
    return user
  })
}

export function removeUser(id: string): Promise<void> {
  return call(() => {
    const data = getData()
    const u = data.settings.users.find((x) => x.id === id)
    if (!u) throw new ServiceError('Usuário não encontrado.')
    if (id === data.settings.currentUserId) throw new ServiceError('Você não pode remover o usuário que está usando.')
    if (u.role === 'dono' && data.settings.users.filter((x) => x.role === 'dono').length === 1) throw new ServiceError('Precisa existir pelo menos um dono.')
    commit({ settings: { ...data.settings, users: data.settings.users.filter((x) => x.id !== id) } })
  })
}

/** Quem está usando o sistema (troca de papel na demonstração) */
export function setCurrentUser(id: string): Promise<Settings> {
  return call(() => {
    const data = getData()
    if (!data.settings.users.some((u) => u.id === id)) throw new ServiceError('Usuário não encontrado.')
    commit({ settings: { ...data.settings, currentUserId: id } })
    return getData().settings
  })
}

const ACCOUNTS: Record<IntegrationKey, string> = {
  email: 'cobranca@cerradolocacoes.com.br',
  pix: 'Chave CNPJ cadastrada',
  boleto: 'Conta 4410-7 · Banco Cooperativo',
  nfse: 'Prefeitura de Brasília · certificado A1',
  contaAzul: 'Conta da empresa',
}

/** Conecta ou desconecta uma integração (simulado) */
export function setIntegration(key: IntegrationKey, connected: boolean, account?: string): Promise<Settings> {
  return call(() => {
    const data = getData()
    if (!(key in data.settings.integrations)) throw new ServiceError('Integração desconhecida.')
    const integration = connected ? { connected: true, account: account ?? ACCOUNTS[key], connectedAt: demoNowISO() } : { connected: false }
    commit({ settings: { ...data.settings, integrations: { ...data.settings.integrations, [key]: integration } } })
    return getData().settings
  })
}

/** Volta toda a demonstração ao estado da semente de hoje */
export function resetDemo(): Promise<void> {
  return call(() => {
    resetDb()
  })
}
