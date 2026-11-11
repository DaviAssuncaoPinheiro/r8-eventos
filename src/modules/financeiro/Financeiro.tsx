import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, Download, FileText, Plus, Search, Send, X } from "lucide-react";
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Input,
  Money,
  MoneyCard,
  PillBars,
  Skeleton,
  StatusDot,
  Tooltip,
  cn,
  notify,
} from "@/ui";
import { Reveal, RollingMoney, Stagger } from "@/ui/Motion";
import { PageHeader } from "@/app/PageHeader";
import { CHARGE_KIND, CHARGE_STATUS } from "@/app/status";
import { addDays, today } from "@/domain/dates";
import { formatMoney } from "@/lib/format";
import {
  exportCsv,
  getMoneyPanel,
  getReceivables,
  listCharges,
  sendCharge,
  sendReminder,
  useQuery,
} from "@/services";
import type { ChargeFilter, ChargeStatus, ChargeView } from "@/services";
import { ChargeDrawer } from "./components/ChargeDrawer";
import { ContaAzul } from "./components/ContaAzul";
import { Dunning } from "./components/Dunning";
import { FilterPills } from "./components/FilterPills";
import { NewChargeDrawer } from "./components/NewChargeDrawer";
import { dueLabel, errMessage } from "./lib";

type StatusParam = ChargeStatus | "todas";
type Band = "em_dia" | "ate15" | "ate30" | "mais30";

const STATUSES: ChargeStatus[] = [
  "rascunho",
  "aberta",
  "atrasada",
  "paga",
  "cancelada",
];
const STATUS_PLURAL: Record<ChargeStatus, string> = {
  rascunho: "Rascunhos",
  aberta: "Abertas",
  atrasada: "Atrasadas",
  paga: "Pagas",
  cancelada: "Canceladas",
};

const BANDS: {
  id: Band;
  label: string;
  min: number;
  max: number | null;
  bar: string;
  dot: string;
}[] = [
  {
    id: "em_dia",
    label: "Em dia",
    min: -9999,
    max: 0,
    bar: "bg-accent",
    dot: "bg-accent",
  },
  {
    id: "ate15",
    label: "1 a 15 dias",
    min: 1,
    max: 15,
    bar: "bg-warn",
    dot: "bg-warn",
  },
  {
    id: "ate30",
    label: "16 a 30 dias",
    min: 16,
    max: 30,
    bar: "bg-danger",
    dot: "bg-danger",
  },
  {
    id: "mais30",
    label: "Mais de 30 dias",
    min: 31,
    max: null,
    bar: "bg-danger-solid",
    dot: "bg-danger-solid",
  },
];

const OPEN: ChargeStatus[] = ["aberta", "atrasada"];
const inBand = (c: ChargeView, b: (typeof BANDS)[number]) =>
  OPEN.includes(c.status) &&
  c.daysOverdue >= Math.max(b.min, 0) &&
  (b.max === null || c.daysOverdue <= b.max) &&
  (b.id === "em_dia" ? c.daysOverdue === 0 : true);

const bandRange = (
  b: (typeof BANDS)[number],
): Pick<ChargeFilter, "from" | "to"> => {
  const t = today();
  if (b.id === "em_dia") return { from: t };
  return {
    from: b.max === null ? undefined : addDays(t, -b.max),
    to: addDays(t, -b.min),
  };
};

/** Número em vermelho que sobe de zero, como o MoneyCard. */
function DangerNumber({ value }: { value: number }) {
  return (
    <span className="text-danger-ink">
      <RollingMoney value={value} kpi />
    </span>
  );
}

function dueDateText(c: ChargeView) {
  return dueLabel(c);
}

const PAGE = 25;

export default function Financeiro() {
  const navigate = useNavigate();
  const { "*": rest = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const openId = /^cobranca\/([^/]+)/.exec(rest)?.[1] ?? null;
  const search = params.toString() ? `?${params.toString()}` : "";

  const rawStatus = params.get("status");
  const status: StatusParam = STATUSES.includes(rawStatus as ChargeStatus)
    ? (rawStatus as ChargeStatus)
    : "todas";
  const rawBand = params.get("faixa");
  const band = BANDS.find((b) => b.id === rawBand) ?? null;
  const qText = params.get("q") ?? "";

  const [newOpen, setNewOpen] = React.useState(false);
  const [limit, setLimit] = React.useState(PAGE);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const listRef = React.useRef<HTMLElement>(null);

  const rec = useQuery(getReceivables, []);
  const panel = useQuery(getMoneyPanel, []);
  const all = useQuery(() => listCharges(), []);

  const patchParams = (p: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(p)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const charges = all.data ?? [];
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visible = React.useMemo(() => {
    const t = norm(qText.trim());
    return charges.filter(
      (c) =>
        (status === "todas" || c.status === status) &&
        (!band || inBand(c, band)) &&
        (!t ||
          norm(`${c.clientName} ${c.code} ${c.rentalCode ?? ""}`).includes(t)),
    );
  }, [charges, status, band, qText]);

  const countBase = React.useMemo(
    () =>
      charges.filter(
        (c) =>
          (!band || inBand(c, band)) &&
          (!norm(qText.trim()) ||
            norm(`${c.clientName} ${c.code} ${c.rentalCode ?? ""}`).includes(
              norm(qText.trim()),
            )),
      ),
    [charges, band, qText],
  );
  const counts = (s: StatusParam) =>
    s === "todas"
      ? countBase.length
      : countBase.filter((c) => c.status === s).length;

  const openCharge = (id: string) =>
    navigate(`/financeiro/cobranca/${id}${search}`);
  const closeCharge = () => navigate(`/financeiro${search}`);

  const quick = async (c: ChargeView) => {
    setBusy(c.id);
    try {
      if (c.status === "rascunho") {
        await sendCharge(c.id, { via: "email", method: c.method });
        notify.success("Cobrança enviada");
      } else {
        await sendReminder(c.id, "email");
        notify.success(
          c.status === "atrasada"
            ? `Cobrança enviada a ${c.clientName}`
            : "Lembrete enviado",
        );
      }
    } catch (e) {
      notify.error(errMessage(e, "Não foi possível enviar. Tente de novo."));
    } finally {
      setBusy(null);
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const filter: ChargeFilter = { q: qText.trim() || undefined };
      if (status !== "todas") filter.status = status;
      else if (band) filter.status = OPEN;
      if (band) Object.assign(filter, bandRange(band));
      const csv = await exportCsv(filter);
      const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cobrancas-${today()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify.success("Arquivo CSV baixado");
    } catch (e) {
      notify.error(errMessage(e, "Não foi possível exportar. Tente de novo."));
    } finally {
      setExporting(false);
    }
  };

  const byBand = BANDS.map((b) => {
    const list = charges.filter((c) => inBand(c, b));
    return {
      ...b,
      value: Math.round(list.reduce((a, c) => a + c.value, 0) * 100) / 100,
      count: list.length,
    };
  });
  const bandTotal = byBand.reduce((a, b) => a + b.value, 0);

  const months = (panel.data?.revenueByMonth ?? []).slice(-6);
  const bars = months.map((m, i) => ({
    label: m.label,
    fullLabel: m.label,
    value: m.value,
    tone:
      i === months.length - 1
        ? ("strong" as const)
        : i === months.length - 2
          ? ("solid" as const)
          : ("soft" as const),
  }));

  const sample = charges.find(
    (c) => c.status === "aberta" || c.status === "atrasada",
  );
  const loadError = (rec.error && !rec.data) || (all.error && !all.data);

  return (
    <>
      <PageHeader
        title="Financeiro"
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              icon={Plus}
              onClick={() => setNewOpen(true)}
            >
              Nova cobrança
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={Download}
              loading={exporting}
              onClick={doExport}
            >
              Exportar CSV
            </Button>
          </>
        }
      />

      {loadError ? (
        <Banner
          tone="danger"
          title="Não foi possível carregar o financeiro."
          className="mb-4"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void rec.refetch();
                void all.refetch();
              }}
            >
              Tentar de novo
            </Button>
          }
        />
      ) : null}

      {/* sem dados, a tela mostra só a faixa de erro: zeros e listas vazias enganariam */}
      {loadError ? null : (
      <>
      {/* 1. os três números */}
      {rec.initialLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-12">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              role="status"
              aria-busy="true"
              aria-label="Carregando indicador"
              className={cn(
                "flex h-[168px] flex-col justify-between rounded-card bg-raised p-6 @min-[1180px]/frame:col-span-4",
                i === 2 && "sm:col-span-2",
              )}
            >
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ))}
        </div>
      ) : rec.data ? (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-12">
            <MoneyCard
              hero
              title="A receber"
              value={rec.data.toReceive.value}
              formula="Soma das cobranças abertas e atrasadas."
              className="@min-[1180px]/frame:col-span-4"
            />
            <MoneyCard
              title="Recebido no mês"
              value={rec.data.receivedThisMonth.value}
              formula="Cobranças pagas neste mês, pela data do pagamento."
              onOpen={() => patchParams({ status: "paga", faixa: null })}
              openLabel="Ver cobranças pagas"
              className="@min-[1180px]/frame:col-span-4"
            />
            <MoneyCard
              title="Atrasado"
              display={<DangerNumber value={rec.data.overdue.value} />}
              formula="Cobranças atrasadas que ainda não foram pagas."
              onOpen={() => patchParams({ status: "atrasada", faixa: null })}
              openLabel="Ver cobranças atrasadas"
              className="sm:col-span-2 @min-[1180px]/frame:col-span-4"
            />
        </Stagger>
      ) : null}

      {/* 2. idade, recebido por mês, Conta Azul */}
      <Stagger className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12" delay={0.15}>
        <section
          aria-label="A receber por idade"
          className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-title-sub">Idade da dívida</h2>
            {band ? (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => patchParams({ faixa: null })}
              >
                Limpar faixa
              </Button>
            ) : null}
          </div>
          {all.initialLoading ? (
            <div
              role="status"
              aria-busy="true"
              aria-label="Carregando faixas"
              className="mt-5 flex flex-col gap-4"
            >
              <Skeleton className="h-4 rounded-pill" />
              <Skeleton shape="block" className="h-28" />
            </div>
          ) : bandTotal === 0 ? (
            <EmptyState
              icon={Check}
              title="Nada em aberto agora"
              className="py-8"
            />
          ) : (
            <>
              <div
                className="mt-5 flex h-5 gap-1"
                role="group"
                aria-label="Filtrar por idade"
              >
                {byBand
                  .filter((b) => b.value > 0)
                  .map((b) => (
                    <Tooltip
                      key={b.id}
                      content={`${b.label}: ${formatMoney(b.value)}`}
                    >
                      <button
                        type="button"
                        aria-label={`${b.label}: ${formatMoney(b.value)}`}
                        aria-pressed={band?.id === b.id}
                        onClick={() =>
                          patchParams({
                            faixa: band?.id === b.id ? null : b.id,
                          })
                        }
                        style={{ flexGrow: b.value }}
                        className={cn(
                          "ds-hit min-w-3 rounded-pill transition-[opacity,filter] duration-150 hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          b.bar,
                          band && band.id !== b.id && "opacity-35",
                        )}
                      />
                    </Tooltip>
                  ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1">
                {byBand
                  .filter((b) => b.value > 0)
                  .map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        aria-pressed={band?.id === b.id}
                        onClick={() =>
                          patchParams({
                            faixa: band?.id === b.id ? null : b.id,
                          })
                        }
                        className={cn(
                          "ds-touch -mx-2 flex w-[calc(100%+16px)] flex-col items-start rounded-control px-2 py-2 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          band?.id === b.id && "bg-sunken",
                        )}
                      >
                        <span className="flex items-center gap-2 text-caption font-semibold text-fg-2">
                          <span
                            aria-hidden
                            className={cn("size-2.5 rounded-pill", b.dot)}
                          />
                          {b.label}
                        </span>
                        <span
                          className={cn(
                            "tnum text-body-lg font-semibold",
                            b.id !== "em_dia" && b.value > 0
                              ? "text-danger-ink"
                              : "text-fg",
                          )}
                        >
                          {formatMoney(b.value)}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>

        <section
          aria-label="Recebido por mês"
          className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5"
        >
          <h2 className="text-title-sub">Recebido por mês</h2>
          {panel.initialLoading ? (
            <div
              role="status"
              aria-busy="true"
              aria-label="Carregando gráfico"
              className="mt-5 flex h-[184px] items-end gap-3"
            >
              {[60, 90, 70, 110, 100, 140].map((h, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-pill"
                  shape="block"
                />
              ))}
            </div>
          ) : (
            <PillBars
              className="mt-2"
              height={150}
              data={bars}
              format={(v) => formatMoney(v)}
              label="Recebido por mês"
            />
          )}
        </section>

        <div className="min-w-0 sm:col-span-1 @min-[1180px]/frame:col-span-3 [&>section]:h-full">
          <ContaAzul paidThisMonth={rec.data?.receivedThisMonth.count ?? 0} />
        </div>
      </Stagger>

      {/* 3. cobranças */}
      <Reveal delay={0.3} className="mt-4">
      <section
        ref={listRef}
        aria-label="Cobranças"
        className="min-w-0 rounded-card bg-raised p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h2 className="text-title-sub">Cobranças</h2>
          <div className="w-full sm:w-[300px]">
            <Input
              type="search"
              aria-label="Buscar cliente, cobrança ou locação"
              placeholder="Buscar cliente"
              prefix={<Search size={16} strokeWidth={2} aria-hidden />}
              value={qText}
              onChange={(e) => patchParams({ q: e.target.value })}
              className="rounded-pill"
            />
          </div>
        </div>
        <FilterPills<StatusParam>
          className="mt-4"
          label="Situação"
          value={status}
          onChange={(v) => patchParams({ status: v === "todas" ? null : v })}
          options={[
            {
              value: "todas",
              label: "Todas",
              count: all.data ? counts("todas") : undefined,
            },
            ...STATUSES.map((s) => ({
              value: s as StatusParam,
              label: STATUS_PLURAL[s],
              count: all.data ? counts(s) : undefined,
            })),
          ]}
        />

        {all.initialLoading ? (
          <ul
            role="status"
            aria-busy="true"
            aria-label="Carregando cobranças"
            className="mt-4 flex flex-col"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <li
                key={i}
                className="flex items-center gap-4 border-t border-hairline py-4 first:border-t-0"
              >
                <Skeleton shape="circle" className="size-11" />
                <div className="flex-1">
                  <Skeleton className="w-1/3" />
                  <Skeleton className="mt-2 h-3 w-1/5" />
                </div>
                <Skeleton className="h-5 w-24" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              charges.length === 0
                ? "As cobranças aparecem aqui"
                : "Nenhuma cobrança com este filtro"
            }
            action={
              charges.length === 0 ? (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setNewOpen(true)}
                >
                  Nova cobrança
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() =>
                    patchParams({ status: null, faixa: null, q: null })
                  }
                >
                  Limpar filtros
                </Button>
              )
            }
          />
        ) : (
          <>
            <ul className="mt-2 flex flex-col">
              {visible.slice(0, limit).map((c) => {
                const st = CHARGE_STATUS[c.status];
                const late = c.status === "atrasada";
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 border-t border-hairline first:border-t-0"
                  >
                    <button
                      type="button"
                      onClick={() => openCharge(c.id)}
                      aria-label={`Abrir cobrança ${c.code}, ${c.clientName}`}
                      className="group -mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-control px-2 py-3.5 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-4"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "hidden size-11 shrink-0 place-items-center rounded-pill text-body font-bold sm:grid",
                          late
                            ? "bg-danger-soft text-danger-ink"
                            : "bg-sunken text-fg-2",
                        )}
                      >
                        {c.clientName
                          .split(" ")
                          .filter((w) => w.length > 2)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase() ||
                          c.clientName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-lg font-semibold text-fg">
                          {c.clientName}
                        </span>
                        <span className="tnum block text-caption text-fg-3">
                          {c.code}
                        </span>
                      </span>
                      <span className="hidden shrink-0 md:block">
                        <Badge tone="neutral">{CHARGE_KIND[c.kind]}</Badge>
                      </span>
                      <span
                        className={cn(
                          "tnum hidden w-24 shrink-0 text-body sm:block",
                          late ? "font-semibold text-danger-ink" : "text-fg-2",
                        )}
                      >
                        {dueDateText(c)}
                      </span>
                      <span className="hidden w-28 shrink-0 @min-[1180px]/frame:block">
                        <StatusDot tone={st.tone}>{st.label}</StatusDot>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="tnum block text-body-lg font-semibold text-fg">
                          {formatMoney(c.value)}
                        </span>
                        <span
                          className={cn(
                            "tnum block text-caption sm:hidden",
                            late
                              ? "font-semibold text-danger-ink"
                              : "text-fg-3",
                          )}
                        >{`${st.label}, ${dueDateText(c)}`}</span>
                      </span>
                    </button>
                    <span className="flex w-[104px] shrink-0 justify-end">
                      {c.status === "paga" ? (
                        <span
                          role="img"
                          aria-label="Paga"
                          className="grid size-9 place-items-center rounded-pill bg-ok-soft text-ok-ink"
                        >
                          <Check size={18} strokeWidth={2} aria-hidden />
                        </span>
                      ) : c.status === "cancelada" ? null : (
                        <Button
                          variant={late ? "primary" : "secondary"}
                          size="sm"
                          icon={Send}
                          loading={busy === c.id}
                          onClick={() => void quick(c)}
                          aria-label={`${c.status === "rascunho" ? "Enviar" : c.status === "aberta" ? "Lembrar" : "Cobrar"} ${c.clientName}`}
                        >
                          {c.status === "rascunho"
                            ? "Enviar"
                            : c.status === "aberta"
                              ? "Lembrar"
                              : "Cobrar"}
                        </Button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            {visible.length > limit ? (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setLimit((l) => l + PAGE)}
                >
                  Mostrar mais cobranças
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
      </Reveal>

      {/* 4. régua */}
      <div className="mt-4">
        <Dunning sample={sample} />
      </div>
      </>
      )}

      <ChargeDrawer chargeId={openId} onClose={closeCharge} />
      <NewChargeDrawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false);
          openCharge(id);
        }}
      />
    </>
  );
}
