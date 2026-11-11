import { create } from 'zustand'

interface CopilotoState {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useCopilotoStore = create<CopilotoState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

/** Abre a gaveta do Copiloto (de qualquer tela) */
export function openCopiloto() {
  useCopilotoStore.getState().setOpen(true)
}

export function closeCopiloto() {
  useCopilotoStore.getState().setOpen(false)
}
