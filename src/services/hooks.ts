/*
  Hooks de dados para as telas.

    const { data, loading, error, refetch } = useQuery(() => listRentals({ status: 'em_campo' }), [])
    const { run, loading, error } = useMutation(confirmRental)   // await run(id) dentro de try/catch

  useQuery refaz a busca sozinho quando QUALQUER mutação acontece (sobe `version` no store),
  mantém `data` anterior enquanto recarrega e ignora respostas fora de ordem.
*/
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDb } from '@/data/db'
import { getSegment, type SegmentLabels, type SegmentPack } from '@/domain/segments'
import type { Settings } from '@/domain/types'

export interface QueryResult<T> {
  data: T | undefined
  /** true durante qualquer busca (inclusive refeita em segundo plano) */
  loading: boolean
  /** true só na primeira carga, quando ainda não há dados (use para o esqueleto) */
  initialLoading: boolean
  error: Error | undefined
  refetch: () => Promise<void>
}

export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): QueryResult<T> {
  const version = useDb((s) => s.version)
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: Error }>({ loading: true })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const seq = useRef(0)
  const mounted = useRef(true)

  const run = useCallback(async () => {
    const id = ++seq.current
    setState((s) => (s.loading ? s : { ...s, loading: true }))
    try {
      const data = await fnRef.current()
      if (!mounted.current || id !== seq.current) return
      setState({ data, loading: false })
    } catch (e) {
      if (!mounted.current || id !== seq.current) return
      setState((s) => ({ data: s.data, loading: false, error: e instanceof Error ? e : new Error(String(e)) }))
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, run, ...deps])

  return { data: state.data, loading: state.loading, initialLoading: state.loading && state.data === undefined, error: state.error, refetch: run }
}

export interface MutationResult<A extends unknown[], R> {
  /** Rejeita com ServiceError em caso de falha (use try/catch ou .catch) */
  run: (...a: A) => Promise<R>
  loading: boolean
  error: Error | undefined
}

export function useMutation<A extends unknown[], R>(fn: (...a: A) => Promise<R>): MutationResult<A, R> {
  const [state, setState] = useState<{ loading: boolean; error?: Error }>({ loading: false })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const run = useCallback(async (...a: A): Promise<R> => {
    if (mounted.current) setState({ loading: true })
    try {
      const r = await fnRef.current(...a)
      if (mounted.current) setState({ loading: false })
      return r
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      if (mounted.current) setState({ loading: false, error: err })
      throw err
    }
  }, [])
  return { run, loading: state.loading, error: state.error }
}

/** Configurações reativas (leitura síncrona do store: marca, pacote e IA aplicam na hora em toda a casca) */
export function useSettings(): Settings {
  return useDb((s) => s.settings)
}

/** Pacote de segmento ativo */
export function useSegment(): SegmentPack {
  const id = useDb((s) => s.settings.segmentId)
  return getSegment(id)
}

/** Rótulos do segmento ativo: use em vez de escrever "banheiro" ou "limpeza" no texto */
export function useLabels(): SegmentLabels {
  return useSegment().labels
}
