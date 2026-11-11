import * as React from 'react'
import { PartyPopper, RotateCw, Truck } from 'lucide-react'
import { Button, Card, EmailPreview, MapaReal, RollingMoney, RollingNumber, Stagger, celebrate } from '@/ui'
import type { RealPin, RealRoute, RealTruck } from '@/ui'
import { BAIRRO, BASE } from '@/data/geo'
import { TypeArtTile, ART_TYPE_IDS } from '@/modules/equipamentos/components/TypeArt'
import { DsSection, Specimen } from '../kit'

/* ───────── Mapa real ───────── */

const at = (id: string) => ({ lat: BAIRRO[id].lat, lng: BAIRRO[id].lng })
const PINOS: RealPin[] = [
  { id: 'p1', ...at('asa-sul'), label: '1', title: 'Parada 1: Asa Sul, limpeza concluída', tone: 'ok' },
  { id: 'p2', ...at('lago-sul'), label: '2', title: 'Parada 2: Lago Sul, a caminho', tone: 'info', pulse: true },
  { id: 'p3', ...at('park-way'), label: '3', title: 'Parada 3: Park Way, agendada', tone: 'neutral' },
]
const ROTA: RealRoute[] = [{ id: 'rota-fc', points: [BASE, at('asa-sul'), at('lago-sul'), at('park-way')] }]
const PASSOS = [0.15, 0.4, 0.65, 0.9]

export function MapaRealSection() {
  const [step, setStep] = React.useState(1)
  const trucks: RealTruck[] = [{ id: 't1', lat: BASE.lat, lng: BASE.lng, routeId: 'rota-fc', progress: PASSOS[step], label: 'FC', title: 'Caminhão da Equipe Fábio a caminho do Lago Sul', tone: 'accent' }]
  return (
    <DsSection id="mapa-real" title="Mapa real">
      <Specimen title="Pinos, rota e caminhão">
        <div className="h-[420px] overflow-hidden rounded-card bg-raised p-2">
          <div className="size-full overflow-hidden rounded-[16px]">
            <MapaReal pins={PINOS} routes={ROTA} trucks={trucks} label="Mapa de Brasília com 3 paradas, 1 rota pelas ruas e o caminhão da Equipe Fábio" />
          </div>
        </div>
        <div className="mt-3">
          <Button size="sm" icon={Truck} onClick={() => setStep((s) => (s + 1) % PASSOS.length)}>
            Andar com o caminhão
          </Button>
        </div>
      </Specimen>
    </DsSection>
  )
}

/* ───────── Animação ───────── */

const VALORES = [
  { money: 48060, units: 121, pct: 67 },
  { money: 64224.51, units: 143, pct: 79 },
  { money: 8061.76, units: 96, pct: 53 },
]

export function AnimacaoSection() {
  const [run, setRun] = React.useState(0)
  const [i, setI] = React.useState(0)
  const v = VALORES[i]
  return (
    <DsSection id="animacao" title="Animação">
      <Specimen title="Stagger">
        <Stagger key={run} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['Alugado hoje', 'Parado', 'Avarias', 'Extras'].map((t) => (
            <Card key={t} padding="sm">
              <span className="text-body font-semibold">{t}</span>
            </Card>
          ))}
        </Stagger>
        <div className="mt-3">
          <Button size="sm" icon={RotateCw} onClick={() => setRun((n) => n + 1)}>
            Repetir cascata
          </Button>
        </div>
      </Specimen>

      <Specimen title="RollingMoney e RollingNumber">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4 rounded-card bg-raised p-5">
          <RollingMoney kpi value={v.money} className="text-kpi" />
          <RollingNumber value={v.units} className="text-kpi" />
          <RollingNumber value={v.pct} suffix="%" className="text-kpi" />
        </div>
        <div className="mt-3">
          <Button size="sm" icon={RotateCw} onClick={() => setI((n) => (n + 1) % VALORES.length)}>
            Mudar valores
          </Button>
        </div>
      </Specimen>

      <Specimen title="celebrate">
        <Button variant="primary" icon={PartyPopper} onClick={(e) => celebrate(e.currentTarget)}>
          Dinheiro entrou
        </Button>
      </Specimen>
    </DsSection>
  )
}

/* ───────── E-mail ───────── */

export function EmailSection() {
  return (
    <DsSection id="email" title="Prévia do e-mail">
      <div className="max-w-[560px]">
        <EmailPreview
          from="Cerrado Locações"
          to="eduardo.vasconcelos@festacapital.com.br"
          subject="Avaria registrada na locação: cobrança COB-5329"
          attachment={<TypeArtTile typeId="tnd5" className="h-36 w-full" />}
          body={'Olá, Eduardo,\n\nEncontramos uma avaria na lona da TND-0040. O valor do reparo é R$ 1.386,40, com vencimento em 21/11/2026.'}
          cta="Pagar R$ 1.386,40 com Pix"
        />
      </div>
    </DsSection>
  )
}

/* ───────── Ilustração do equipamento ───────── */

const NOMES: Record<(typeof ART_TYPE_IDS)[number], string> = {
  bq: 'Banheiro químico',
  pcd: 'Cabine PcD',
  pia: 'Pia portátil',
  trailer: 'Trailer sanitário',
  tnd5: 'Tenda 5 x 5',
  tnd10: 'Tenda 10 x 10',
  ala: 'Alambrado',
  fec: 'Fechamento',
  bal: 'Balcão de bar',
}

export function IlustracaoSection() {
  return (
    <DsSection id="ilustracoes" title="Ilustração do equipamento">
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {ART_TYPE_IDS.map((id) => (
          <li key={id}>
            <TypeArtTile typeId={id} tag={NOMES[id]} label={NOMES[id]} className="aspect-[5/4] w-full rounded-card" />
          </li>
        ))}
      </ul>
    </DsSection>
  )
}
