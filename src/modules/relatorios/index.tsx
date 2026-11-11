import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Download } from 'lucide-react'
import type { MonthlyClientReport, OccupancyReport, RevenueByClientRow, RevenueByEquipmentRow, TeamPerformanceRow } from '@/services'
import { useLabels } from '@/services'
import { Button, Menu, Segmented, notify } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { Equipes, Ocupacao, ReceitaClientes, Rendimento } from './components/Blocos'
import { Mensal } from './components/Mensal'
import { PERIODOS, downloadCsv, rangeOf, type Periodo } from './lib'

function Relatorios() {
  const l = useLabels()
  const [periodo, setPeriodo] = React.useState<Periodo>('3m')
  const range = React.useMemo(() => rangeOf(periodo), [periodo])
  const occ = React.useRef<OccupancyReport>()
  const rc = React.useRef<{ rows: RevenueByClientRow[]; total: number }>()
  const re = React.useRef<{ rows: RevenueByEquipmentRow[]; perUnit: Record<string, number>; total: number }>()
  const eq = React.useRef<TeamPerformanceRow[]>()
  const [monthly, setMonthly] = React.useState<MonthlyClientReport | undefined>()
  const onOcc = React.useCallback((d: OccupancyReport) => void (occ.current = d), [])
  const onRc = React.useCallback((d: { rows: RevenueByClientRow[]; total: number }) => void (rc.current = d), [])
  const onRe = React.useCallback((d: { rows: RevenueByEquipmentRow[]; perUnit: Record<string, number>; total: number }) => void (re.current = d), [])
  const onEq = React.useCallback((d: TeamPerformanceRow[]) => void (eq.current = d), [])

  const stamp = `${range.from}_a_${range.to}`
  const exporters: { label: string; run: () => boolean }[] = [
    {
      label: 'Ocupação',
      run: () => {
        const d = occ.current
        if (!d) return false
        downloadCsv(`ocupacao_${stamp}.csv`, ['Dia', 'Em campo', 'Reservado', 'Total', 'Ocupação (%)'], d.points.map((p) => [formatDate(p.date), p.inField, p.reserved, p.total, p.pct]))
        return true
      },
    },
    {
      label: 'Receita por cliente',
      run: () => {
        const d = rc.current
        if (!d) return false
        downloadCsv(`receita-por-cliente_${stamp}.csv`, ['Cliente', 'Tipo', 'Cobranças', 'Receita', 'Parte (%)'], d.rows.map((r) => [r.client.name, r.kind, r.charges, r.value, r.sharePct]))
        return true
      },
    },
    {
      label: `Rendimento por ${l.equipment}`,
      run: () => {
        const d = re.current
        if (!d) return false
        downloadCsv(`rendimento-por-equipamento_${stamp}.csv`, ['Tipo', 'Receita', `Por ${l.unit}`, 'Dias alugados', 'Parte (%)'], d.rows.map((r) => [r.type.name, r.value, d.perUnit[r.type.id] ?? 0, r.unitDays, r.sharePct]))
        return true
      },
    },
    {
      label: 'Desempenho por equipe',
      run: () => {
        const d = eq.current
        if (!d) return false
        downloadCsv(
          `desempenho-por-equipe_${stamp}.csv`,
          ['Equipe', 'Agendados', 'Concluídos', 'Pontualidade (%)', 'Duração média (min)', 'Atrasos', 'Fotos'],
          d.map((r) => [r.team.name, r.scheduled, r.completed, r.onTimePct, r.avgDurationMin, r.late, r.photos]),
        )
        return true
      },
    },
  ]
  if (monthly) {
    exporters.push({
      label: 'Relatório mensal do cliente',
      run: () => {
        const m = monthly
        downloadCsv(
          `relatorio-${m.month}_${m.client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
          ['Data', 'Serviço', 'Unidades', 'Equipe', 'Fotos', 'Assinou'],
          m.cleanings.map((c) => [formatDateTime(c.at), c.typeLabel, c.unitCodes.join(' '), c.teamName, c.photos.length, c.signature?.name ?? '']),
        )
        return true
      },
    })
  }

  const exportOne = (e: (typeof exporters)[number]) => {
    try {
      if (e.run()) notify.success(`${e.label} exportado em CSV`)
      else notify.error('Os dados ainda estão carregando. Tente de novo.')
    } catch {
      notify.error('Não foi possível exportar. Tente de novo.')
    }
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        actions={
          <>
            <Segmented<Periodo> label="Período" value={periodo} onChange={setPeriodo} options={PERIODOS} />
            <Menu
              align="end"
              trigger={
                <Button variant="secondary" size="lg" icon={Download}>
                  Exportar
                </Button>
              }
              items={exporters.map((e) => ({ label: e.label, onSelect: () => exportOne(e) }))}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <div className="min-w-0 @min-[1180px]/frame:col-span-7">
          <Ocupacao key={`o-${periodo}`} range={range} onData={onOcc} />
        </div>
        <div className="min-w-0 @min-[1180px]/frame:col-span-5">
          <ReceitaClientes key={`r-${periodo}`} range={range} onData={onRc} />
        </div>
        <div className="min-w-0 @min-[1180px]/frame:col-span-7">
          <Rendimento key={`e-${periodo}`} range={range} onData={onRe} />
        </div>
        <div className="min-w-0 @min-[1180px]/frame:col-span-5">
          <Equipes key={`q-${periodo}`} range={range} onData={onEq} />
        </div>
      </div>

      <Mensal onReport={setMonthly} />
    </>
  )
}

export default function Modulo() {
  return (
    <Routes>
      <Route index element={<Relatorios />} />
      <Route path="*" element={<Navigate to="/relatorios" replace />} />
    </Routes>
  )
}
