import * as React from 'react'
import { BAIRRO, BASE } from '@/data/geo'
import { MapaReal, type RealPin, type RealRoute, type RealTruck } from '@/ui/MapaReal'
import { RollingMoney, RollingNumber, Stagger, celebrate } from '@/ui/Motion'

/* Página temporária de verificação do mapa real. Sai antes da entrega. */
const at = (id: string) => ({ lat: BAIRRO[id].lat, lng: BAIRRO[id].lng })
const base = { lat: BASE.lat, lng: BASE.lng }
export default function MapaTeste() {
  const [sel, setSel] = React.useState<string | undefined>()
  const [k, setK] = React.useState(0)
  const pins: RealPin[] = [
    { id: 'a1', ...at('noroeste'), label: '1', title: 'Parada 1, Noroeste', tone: 'ok', group: 'fc' },
    { id: 'a2', ...at('asa-norte'), label: '2', title: 'Parada 2, Asa Norte', tone: 'accent', pulse: true, group: 'fc' },
    { id: 'b1', ...at('taguatinga'), label: '1', title: 'Parada 1, Taguatinga', tone: 'danger', group: 'ma' },
    { id: 'b2', ...at('aguas-claras'), label: '2', title: 'Parada 2, Águas Claras', tone: 'neutral', group: 'ma' },
    { id: 'c1', ...at('lago-sul'), label: '1', title: 'Parada 1, Lago Sul', tone: 'info', group: 'ws' },
  ]
  const routes: RealRoute[] = [
    { id: 'fc', group: 'fc', points: [base, at('noroeste'), at('asa-norte')] },
    { id: 'ma', group: 'ma', points: [base, at('taguatinga'), at('aguas-claras')], dashed: true },
    { id: 'ws', group: 'ws', points: [base, at('lago-sul')] },
  ]
  const p = k % 2 === 0 ? at('sudoeste') : at('mane-garrincha')
  const trucks: RealTruck[] = [{ id: 't-fc', ...p, label: 'FC', title: 'Caminhão da Equipe Fábio', tone: 'accent', group: 'fc' }]
  return (
    <div className="ds-root min-h-dvh bg-app p-6">
      <div className="mb-3 flex gap-2">
        {['fc', 'ma', 'ws'].map((g) => (
          <button key={g} type="button" onClick={() => setSel(sel === g ? undefined : g)} className="rounded-pill bg-raised px-4 py-2 text-body font-semibold">
            {g}
          </button>
        ))}
        <button type="button" onClick={(e) => (setK(k + 1), celebrate(e.currentTarget))} className="rounded-pill bg-raised px-4 py-2 text-body font-semibold">
          mover
        </button>
        <span className="text-kpi-lg">
          <RollingMoney kpi value={48312.9 + k * 1234.56} />
        </span>
        <span className="text-kpi">
          <RollingNumber value={67 + k} suffix="%" />
        </span>
      </div>
      <Stagger className="mb-3 grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-card bg-raised p-5 text-title-sub">Bloco {n}</div>
        ))}
      </Stagger>
      <div className="h-[520px] overflow-hidden rounded-card bg-raised p-2">
        <div className="relative size-full overflow-hidden rounded-[16px]">
          <MapaReal pins={pins} routes={routes} trucks={trucks} selectedGroup={sel} onSelect={(id) => setSel(pins.find((x) => x.id === id)?.group)} label="Mapa de teste" />
        </div>
      </div>
    </div>
  )
}
