/* Avisos (central de notificações). */
import { commit, getData } from '@/data/db'
import type { Notification } from '@/domain/types'
import { call, ServiceError } from './config'

/** Avisos, mais recentes primeiro */
export function listNotifications(): Promise<Notification[]> {
  return call(() => [...getData().notifications].sort((a, b) => b.at.localeCompare(a.at)))
}

export function getUnreadCount(): Promise<number> {
  return call(() => getData().notifications.filter((n) => !n.read).length)
}

export function markAllRead(): Promise<void> {
  return call(() => {
    const data = getData()
    if (!data.notifications.some((n) => !n.read)) return
    commit({ notifications: data.notifications.map((n) => (n.read ? n : { ...n, read: true })) })
  })
}

export function markRead(id: string): Promise<void> {
  return call(() => {
    const data = getData()
    if (!data.notifications.some((n) => n.id === id)) throw new ServiceError('Aviso não encontrado.')
    commit({ notifications: data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })
  })
}
