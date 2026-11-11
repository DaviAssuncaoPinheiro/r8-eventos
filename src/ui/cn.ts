import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* tailwind-merge precisa conhecer os nomes novos de tamanho de texto, raio e sombra;
   sem isso "text-body text-fg" seria tratado como duas cores e uma delas cairia. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'body', 'body-lg', 'title-card', 'title-sub', 'title-section', 'title-field', 'title-page', 'kpi', 'kpi-lg'],
      radius: ['control', 'card', 'panel', 'tip', 'check', 'pill'],
      shadow: ['overlay', 'drag'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
