import * as React from 'react'
import { cn } from '@/ui'

/*
  Ilustração própria de cada tipo de equipamento. Uma família: viewBox 120x96, linha de chão em y=84,
  dois tons da marca (--accent e --accent-soft), contorno de 2px na tinta da marca, detalhes em --raised
  e sombra de chão em --fg com baixa opacidade. Segue a marca e o tema sozinha (só tokens).
*/

const A = 'var(--accent)'
const AS = 'var(--accent-soft)'
const INK = 'var(--accent-ink)'
const W = 'var(--raised)'

const line = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

function Ground({ rx = 38 }: { rx?: number }) {
  return <ellipse cx="60" cy="85" rx={rx} ry="4.2" fill="var(--fg)" opacity="0.12" />
}

/* ───────── banheiro químico padrão ───────── */
function Bq() {
  return (
    <>
      <Ground rx={26} />
      <rect x="36" y="14" width="48" height="70" rx="8" fill={A} {...line} />
      <rect x="33" y="8" width="54" height="11" rx="5.5" fill={AS} {...line} />
      <rect x="43" y="25" width="34" height="55" rx="5" fill={W} {...line} />
      <rect x="48" y="30" width="24" height="6" rx="3" fill={AS} stroke={INK} strokeWidth="1.5" />
      <path d="M49 44h22M49 49h22" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <rect x="64" y="58" width="7" height="3.5" rx="1.75" fill={A} />
      <circle cx="67.5" cy="70" r="2.4" fill={AS} stroke={INK} strokeWidth="1.5" />
    </>
  )
}

/* ───────── cabine PcD ───────── */
function Pcd() {
  return (
    <>
      <Ground rx={34} />
      <rect x="26" y="14" width="68" height="70" rx="9" fill={A} {...line} />
      <rect x="23" y="8" width="74" height="11" rx="5.5" fill={AS} {...line} />
      <rect x="33" y="25" width="54" height="55" rx="6" fill={W} {...line} />
      <circle cx="60" cy="44" r="12" fill={A} />
      <circle cx="58" cy="38.4" r="1.9" fill={W} />
      <path d="M58 41.6v5h5.4l2.6 5.4" fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55.6 46.4a5.2 5.2 0 1 0 6.6 6.4" fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 68h40" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="79" cy="62" r="2.4" fill={AS} stroke={INK} strokeWidth="1.5" />
    </>
  )
}

/* ───────── pia e lavatório portátil ───────── */
function Pia() {
  return (
    <>
      <Ground rx={34} />
      <path d="M60 46V30q0-7 7-7h4" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M60 46V30q0-7 7-7h4" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M71 23v5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M71 31v2M71 36v1.5" stroke={AS} strokeWidth="2" strokeLinecap="round" />
      <rect x="32" y="52" width="56" height="30" rx="7" fill={A} {...line} />
      <rect x="27" y="42" width="66" height="13" rx="6.5" fill={AS} {...line} />
      <path d="M40 48.5h40" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <rect x="38" y="59" width="19" height="17" rx="4" fill={W} {...line} />
      <rect x="63" y="59" width="19" height="17" rx="4" fill={W} {...line} />
      <path d="M53 67.5h1.5M65.5 67.5H67" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

/* ───────── trailer sanitário ───────── */
function Trl() {
  return (
    <>
      <Ground rx={46} />
      <path d="M16 62H5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="2.5" y="58.5" width="5" height="7" rx="2" fill={AS} stroke={INK} strokeWidth="1.8" />
      <rect x="14" y="22" width="92" height="46" rx="9" fill={A} {...line} />
      <rect x="14" y="22" width="92" height="9" rx="4.5" fill={AS} {...line} />
      <rect x="40" y="15" width="24" height="8" rx="3.5" fill={W} {...line} />
      <rect x="22" y="36" width="15" height="24" rx="3.5" fill={W} {...line} />
      <rect x="41" y="36" width="15" height="24" rx="3.5" fill={W} {...line} />
      <rect x="60" y="36" width="15" height="24" rx="3.5" fill={W} {...line} />
      <rect x="79" y="36" width="19" height="24" rx="3.5" fill={AS} {...line} />
      <path d="M26 44h7M45 44h7M64 44h7" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <path d="M92 69v9" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="73" r="10.5" fill={W} {...line} />
      <circle cx="66" cy="73" r="4" fill={A} stroke={INK} strokeWidth="1.8" />
      <circle cx="42" cy="73" r="10.5" fill={W} {...line} />
      <circle cx="42" cy="73" r="4" fill={A} stroke={INK} strokeWidth="1.8" />
    </>
  )
}

/* ───────── tenda 5 x 5: cobertura piramidal ───────── */
function Tnd5() {
  return (
    <>
      <Ground rx={40} />
      <rect x="25" y="48" width="70" height="36" rx="4" fill={AS} opacity="0.75" />
      <path d="M24 48v36M96 48v36" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M60 6V14" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 44 56 12q4-3 8 0l46 32Z" fill={A} {...line} />
      <path d="M60 14 40 44M60 14 80 44" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M10 44h100v6q-3.6 4.8-7.1 0-3.6 4.8-7.2 0-3.5 4.8-7.1 0-3.6 4.8-7.1 0-3.6 4.8-7.2 0-3.5 4.8-7.1 0-3.6 4.8-7.2 0-3.5 4.8-7.1 0-3.6 4.8-7.1 0-3.6 4.8-7.2 0-3.5 4.8-7.1 0-3.6 4.8-7.1 0Z" fill={W} {...line} />
    </>
  )
}

/* ───────── tenda 10 x 10: galpão de duas águas, com laterais ───────── */
function Tnd10() {
  return (
    <>
      <Ground rx={48} />
      <rect x="14" y="44" width="92" height="40" rx="3" fill={AS} {...line} />
      <path d="M14 44v40M42 44v40M78 44v40M106 44v40" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M42 50q18 12 36 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
      <path d="M6 44 22 20q2-3 6-3h64q4 0 6 3l16 24Z" fill={A} {...line} />
      <path d="M6 44h108v6q-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0-3.6 4.8-7.2 0Z" fill={W} {...line} />
      <path d="M42 17 34 44M78 17 86 44" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
    </>
  )
}

/* ───────── alambrado: grades de tela ───────── */
function Ala() {
  const mesh = []
  for (let i = -3; i <= 4; i++) {
    mesh.push(`M${22 + i * 10} 76 ${22 + i * 10 + 40} 30`)
    mesh.push(`M${22 + i * 10 + 40} 76 ${22 + i * 10} 30`)
  }
  return (
    <>
      <Ground rx={46} />
      <defs>
        <clipPath id="ala-l">
          <rect x="14" y="30" width="42" height="46" rx="2" />
        </clipPath>
        <clipPath id="ala-r">
          <rect x="64" y="30" width="42" height="46" rx="2" />
        </clipPath>
      </defs>
      <rect x="14" y="30" width="42" height="46" rx="3" fill={AS} />
      <rect x="64" y="30" width="42" height="46" rx="3" fill={AS} />
      <g clipPath="url(#ala-l)" stroke={INK} strokeWidth="1.3" opacity="0.5">
        <path d={mesh.join('')} />
      </g>
      <g clipPath="url(#ala-r)" stroke={INK} strokeWidth="1.3" opacity="0.5">
        <path d={mesh.join('')} transform="translate(50 0)" />
      </g>
      <rect x="14" y="30" width="42" height="46" rx="3" fill="none" stroke={A} strokeWidth="4.5" />
      <rect x="64" y="30" width="42" height="46" rx="3" fill="none" stroke={A} strokeWidth="4.5" />
      <rect x="14" y="30" width="42" height="46" rx="3" fill="none" {...line} />
      <rect x="64" y="30" width="42" height="46" rx="3" fill="none" {...line} />
      <rect x="53" y="22" width="14" height="60" rx="5" fill={A} {...line} />
      <path d="M57 30h6" stroke={W} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 82h20M92 82h20" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </>
  )
}

/* ───────── fechamento metálico: painéis cheios ───────── */
function Fec() {
  const panel = (x: number) => (
    <g key={x}>
      <rect x={x} y="22" width="28" height="58" rx="4" fill={A} {...line} />
      <rect x={x} y="22" width="28" height="8" rx="4" fill={AS} {...line} />
      <path d={`M${x + 7} 36v38M${x + 14} 36v38M${x + 21} 36v38`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <path d={`M${x + 5} 80v4M${x + 23} 80v4`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
  return (
    <>
      <Ground rx={46} />
      {panel(13)}
      {panel(46)}
      {panel(79)}
      <path d="M8 84h104" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </>
  )
}

/* ───────── balcão de bar ───────── */
function Bal() {
  return (
    <>
      <Ground rx={44} />
      <rect x="30" y="24" width="12" height="15" rx="4" fill={W} {...line} />
      <rect x="76" y="20" width="9" height="19" rx="4.5" fill={AS} {...line} />
      <rect x="49" y="28" width="10" height="11" rx="3" fill={W} {...line} />
      <rect x="14" y="38" width="92" height="11" rx="5.5" fill={AS} {...line} />
      <rect x="19" y="49" width="82" height="34" rx="7" fill={A} {...line} />
      <rect x="27" y="56" width="66" height="21" rx="4" fill={W} {...line} />
      <path d="M38 61v11M49 61v11M60 61v11M71 61v11M82 61v11" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

/* ───────── reserva: caixa de transporte ───────── */
function Generic() {
  return (
    <>
      <Ground rx={34} />
      <rect x="28" y="30" width="64" height="52" rx="9" fill={A} {...line} />
      <rect x="24" y="22" width="72" height="14" rx="7" fill={AS} {...line} />
      <rect x="44" y="45" width="32" height="20" rx="6" fill={W} {...line} />
      <path d="M52 55h16" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

const BY_ID: Record<string, () => React.JSX.Element> = { bq: Bq, pcd: Pcd, pia: Pia, trailer: Trl, trl: Trl, tnd5: Tnd5, tnd10: Tnd10, ala: Ala, fec: Fec, bal: Bal }
const BY_PREFIX: Record<string, () => React.JSX.Element> = { BQ: Bq, PCD: Pcd, PIA: Pia, TRL: Trl, TND: Tnd5, ALA: Ala, FEC: Fec, BAL: Bal }

/** Tipos com ilustração própria, na ordem do catálogo (para páginas de teste e para quem precisa listar). */
export const ART_TYPE_IDS = ['bq', 'pcd', 'pia', 'trailer', 'tnd5', 'tnd10', 'ala', 'fec', 'bal'] as const

/** Ilustração vetorial do tipo. Escolhe por `typeId` e, na falta, por `prefix`; desconhecido recebe o desenho genérico. Decorativa por padrão (use `label` para anunciar). */
export function TypeArt({ typeId, prefix, className, label }: { typeId?: string; prefix?: string; className?: string; label?: string }) {
  const Draw = (typeId ? BY_ID[typeId.toLowerCase()] : undefined) ?? (prefix ? BY_PREFIX[prefix.toUpperCase()] : undefined) ?? Generic
  return (
    <svg viewBox="0 0 120 96" className={cn('block', className)} preserveAspectRatio="xMidYMid meet" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <Draw />
    </svg>
  )
}

/** Quadro com a ilustração sobre o fundo suave da marca. */
export function TypeArtTile({ typeId, prefix, className, label, tag }: { typeId?: string; prefix?: string; className?: string; label?: string; tag?: string }) {
  return (
    <span className={cn('relative grid shrink-0 place-items-center overflow-hidden bg-accent-soft', className)}>
      <TypeArt typeId={typeId} prefix={prefix} label={label} className="size-full p-[8%]" />
      {tag ? (
        <span aria-hidden className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded-pill bg-raised px-2.5 text-caption font-semibold text-fg">
          {tag}
        </span>
      ) : null}
    </span>
  )
}
