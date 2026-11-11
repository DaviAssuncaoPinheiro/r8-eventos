import * as React from "react";
import { Button, Field, Input, Select, Switch, notify } from "@/ui";
import { Drawer } from "@/ui/Drawer";
import { parseMoney } from "@/lib/format";
import { atTime } from "@/domain/dates";
import {
  createService,
  listRentals,
  listTeams,
  useLabels,
  useMutation,
  useQuery,
  type ServiceType,
} from "@/services";

const TYPES: ServiceType[] = [
  "limpeza",
  "entrega",
  "retirada",
  "manutencao",
  "montagem",
];
const FORM_ID = "novo-servico";

export interface NewServiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** dia mostrado na agenda (AAAA-MM-DD) */
  day: string;
  /** equipe já escolhida na tela */
  defaultTeamId?: string;
  onCreated?: (teamId: string) => void;
}

/** Gaveta com o formulário curto de novo serviço (avulso ou extra) */
export function NewServiceDrawer({
  open,
  onOpenChange,
  day,
  defaultTeamId,
  onCreated,
}: NewServiceDrawerProps) {
  const labels = useLabels();
  const rentals = useQuery(
    () => listRentals({ status: ["confirmada", "em_campo"] }),
    [],
  );
  const teams = useQuery(listTeams, []);
  const create = useMutation(createService);

  const [rentalId, setRentalId] = React.useState("");
  const [type, setType] = React.useState<ServiceType>("limpeza");
  const [teamId, setTeamId] = React.useState("");
  const [time, setTime] = React.useState("14:00");
  const [extra, setExtra] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [errors, setErrors] = React.useState<{
    rental?: string;
    time?: string;
    value?: string;
  }>({});

  React.useEffect(() => {
    if (open) {
      setRentalId("");
      setType("limpeza");
      setTeamId(defaultTeamId ?? "");
      setTime("14:00");
      setExtra(false);
      setValue("");
      setErrors({});
    }
  }, [open, defaultTeamId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!rentalId) next.rental = "Escolha a locação";
    if (!/^\d{2}:\d{2}$/.test(time)) next.time = "Informe o horário";
    const money = extra && value.trim() ? parseMoney(value) : undefined;
    if (extra && value.trim() && (money === null || (money ?? 0) < 0))
      next.value = "Valor inválido";
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      const s = await create.run({
        rentalId,
        type,
        teamId: teamId || undefined,
        start: atTime(day, time),
        extra,
        extraValue: extra ? (money ?? undefined) : undefined,
      });
      notify.success(`${labels.serviceTypes[type]} criada para ${s.teamName}`);
      onCreated?.(s.teamId);
      onOpenChange(false);
    } catch {
      notify.error("Não foi possível criar o serviço. Tente de novo.");
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Novo serviço"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            loading={create.loading}
          >
            Criar serviço
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-5"
      >
        <Field label="Locação" error={errors.rental}>
          <Select
            value={rentalId}
            onChange={(e) => setRentalId(e.target.value)}
            placeholder={
              rentals.initialLoading ? "Carregando" : "Escolha a locação"
            }
          >
            {(rentals.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.clientName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as ServiceType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {labels.serviceTypes[t]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Equipe">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Pela região</option>
              {(teams.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Horário" error={errors.time}>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>
        <Switch label="É extra?" checked={extra} onCheckedChange={setExtra} />
        {extra ? (
          <Field label="Valor" optional error={errors.value}>
            <Input
              prefix="R$"
              numeric
              inputMode="decimal"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
        ) : null}
      </form>
    </Drawer>
  );
}
