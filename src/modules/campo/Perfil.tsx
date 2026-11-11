import { Check, CloudOff, Truck } from 'lucide-react'
import { useTheme, type ThemePref } from '@/lib/theme'
import { Badge, Segmented, Switch } from '@/ui'
import { Block, CampoScreen, LoadFailed } from './components/Screen'
import { useCampoDay } from './lib'
import { useCampo } from './store'

export default function Perfil() {
  const { teams, team, setTeam, loading, error, refetch } = useCampoDay()
  const offline = useCampo((s) => s.offline)
  const setOffline = useCampo((s) => s.setOffline)
  const queue = useCampo((s) => s.queue)
  const syncing = useCampo((s) => s.syncing)
  const { pref, setPref } = useTheme()

  return (
    <CampoScreen title="Perfil">
      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span aria-hidden className="ds-skeleton block h-32 w-full rounded-card" />
          <span aria-hidden className="ds-skeleton block h-64 w-full rounded-card" />
        </div>
      ) : error && !team ? (
        <LoadFailed onRetry={() => void refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          {team ? (
            <Block aria-label="Caminhão">
              <div className="flex items-center gap-4">
                <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-pill bg-accent-soft text-title-sub text-accent-ink" style={{ boxShadow: `inset 0 0 0 3px var(--${team.color})` }}>
                  {team.initials}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-title-field">{team.name}</h1>
                  <p className="truncate text-body-lg text-fg-2">{team.members.join(', ')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-control bg-sunken px-4 py-3">
                <Truck size={24} strokeWidth={2} aria-hidden className="shrink-0 text-accent-ink" />
                <span className="min-w-0 flex-1 text-body-lg font-semibold">{team.truck}</span>
                <span className="tnum rounded-tip bg-raised px-3 py-1 text-body-lg font-semibold tracking-wide ring-1 ring-edge ring-inset">{team.plate}</span>
              </div>
            </Block>
          ) : null}

          <section aria-label="Equipe ativa">
            <h2 className="mb-2 px-1 text-title-sub">Equipe ativa</h2>
            <ul role="radiogroup" aria-label="Equipe ativa" className="overflow-hidden rounded-card bg-raised">
              {teams.map((t) => {
                const on = t.id === team?.id
                return (
                  <li key={t.id} className="border-b border-hairline last:border-b-0">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setTeam(t.id)}
                      className={`flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 active:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${on ? 'bg-accent-soft' : ''}`}
                    >
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-pill bg-sunken text-body font-semibold" style={{ boxShadow: `inset 0 0 0 2.5px var(--${t.color})` }}>
                        {t.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-lg font-semibold">{t.name}</span>
                        <span className="block truncate text-body text-fg-2">{t.truck}</span>
                      </span>
                      {on ? <Check size={24} strokeWidth={2.5} aria-hidden className="shrink-0 text-accent-ink" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <Block aria-label="Tema">
            <h2 className="mb-3 text-title-sub">Tema</h2>
            <Segmented<ThemePref>
              block
              label="Tema"
              value={pref}
              onChange={setPref}
              className="h-12"
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
                { value: 'system', label: 'Automático' },
              ]}
            />
          </Block>

          <Block aria-label="Sinal">
            <Switch label="Simular sem sinal" checked={offline} onCheckedChange={setOffline} className="min-h-14 items-center" />
            {queue.length ? (
              <div className="mt-3 border-t border-hairline pt-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-body-lg font-semibold">
                    <CloudOff size={20} strokeWidth={2} aria-hidden className="text-warn-ink" />
                    Aguardando sinal
                  </p>
                  <Badge tone="warn">{syncing ? 'Enviando' : queue.length}</Badge>
                </div>
                <ul className="list-none p-0">
                  {queue.map((q) => (
                    <li key={q.id} className="truncate py-1 text-body text-fg-2">
                      {q.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Block>
        </div>
      )}
    </CampoScreen>
  )
}
