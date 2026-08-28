import { useState } from "react";
import { CalendarDays, Eye, KeyRound, MonitorSmartphone, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PanelAlertDialog, PanelConfirmDialog, PanelFormDialog } from "@/components/PanelActionDialog";
import { trpc } from "@/lib/trpc";
import { getCustomerSubscriptionSignal, getDaysUntilExpiry } from "@/lib/panelModel";
import { CustomerDevicesDialog } from "@/components/CustomerDevicesDialog";

type CustomerStatus = "active" | "attention" | "expired";

type CustomerActionsProps = {
  customer: {
    id: number;
    label: string;
    email: string | null;
    phone: string | null;
    plan: string;
    planId: number | null;
    planCycleId: number | null;
    expiresAt: Date | string;
    status: CustomerStatus;
    screenLimit: number;
    usedScreens: number;
  };
  onChangeStatus: () => void;
};

const cycleLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  custom: "Personalizado",
};

const statusOptions = [
  { value: "active", label: "Ativa" },
  { value: "attention", label: "Próxima do vencimento" },
  { value: "expired", label: "Vencida" },
];

export function CustomerActions({ customer, onChangeStatus }: CustomerActionsProps) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [confirmRotation, setConfirmRotation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const plansQuery = trpc.plans.list.useQuery();
  const updateCustomer = trpc.customers.update.useMutation({ onSuccess: async () => { setEditing(false); await utils.customers.list.invalidate(); toast.success("Cliente e assinatura atualizados."); }, onError: error => toast.error(error.message) });
  const rotate = trpc.customers.rotateXtreamPassword.useMutation({ onSuccess: async result => { setConfirmRotation(false); setNewPassword(result.password); await utils.customers.list.invalidate(); }, onError: error => toast.error(error.message) });
  const remove = trpc.customers.remove.useMutation({ onSuccess: async () => { setConfirmDelete(false); await utils.customers.list.invalidate(); toast.success("Cliente excluído."); }, onError: error => toast.error(error.message) });
  const planOptions = (plansQuery.data ?? []).flatMap(plan => plan.cycles.map(cycle => ({ value: `${plan.id}:${cycle.id}`, label: `${plan.name} · ${cycleLabels[cycle.cycle] ?? cycle.cycle}${plan.isActive && cycle.isActive ? "" : " · inativo"}` })));
  const selectedPlanCycle = customer.planId && customer.planCycleId ? `${customer.planId}:${customer.planCycleId}` : "";
  const signal = getCustomerSubscriptionSignal(customer.status, customer.expiresAt);
  const daysUntilExpiry = getDaysUntilExpiry(customer.expiresAt);
  const signalStyle = signal.tone === "stable" ? "border-[#43E6C2]/20 bg-[#43E6C2]/[.07] text-[#9df6df]" : signal.tone === "attention" ? "border-[#ffbb4d]/20 bg-[#ffbb4d]/[.07] text-[#ffd28b]" : "border-[#ff6b5b]/20 bg-[#ff6b5b]/[.07] text-[#ffaaa2]";

  return <>
    <div className="flex flex-wrap items-center justify-end gap-1">
      <button type="button" onClick={() => setSubscriptionOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#43E6C2]/15 bg-[#43E6C2]/[.04] px-2 py-1.5 text-[11px] font-bold text-[#9df6df] transition hover:bg-[#43E6C2]/[.1]" title="Ver assinatura"><Eye className="h-3.5 w-3.5" /> <span>Ver assinatura</span></button>
      <button type="button" onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white" title="Editar cliente"><PencilLine className="h-4 w-4" /></button>
      <button type="button" onClick={() => setDevicesOpen(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-[#9df6df]" title="Gerenciar telas ativas"><MonitorSmartphone className="h-4 w-4" /></button>
      <button type="button" onClick={() => setConfirmRotation(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-[#9df6df]" title="Gerar nova senha Xtream"><KeyRound className="h-4 w-4" /></button>
      <button type="button" onClick={onChangeStatus} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white" title="Alterar estado da assinatura"><MoreHorizontal className="h-4 w-4" /></button>
      <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-400/10 hover:text-[#ffaaa2]" title="Excluir cliente"><Trash2 className="h-4 w-4" /></button>
    </div>
    <CustomerDevicesDialog open={devicesOpen} onOpenChange={setDevicesOpen} customer={customer} />
    <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}><DialogContent className="border-white/[.1] bg-[#10191f] text-slate-100 sm:max-w-md"><DialogHeader><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#9df6df]">Resumo da assinatura</p><DialogTitle className="text-lg font-extrabold text-white">{customer.label}</DialogTitle><DialogDescription className="text-sm text-slate-400">Dados atuais de acesso, plano e vencimento.</DialogDescription></DialogHeader><div className="mt-2 space-y-3"><div className="flex items-center justify-between gap-4 rounded-xl border border-white/[.08] bg-white/[.03] p-4"><span className="text-sm text-slate-400">Status</span><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${signalStyle}`}>{signal.label}</span></div><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-white/[.08] bg-white/[.025] p-3"><p className="text-xs text-slate-500">Plano</p><p className="mt-1 font-bold text-white">{customer.plan}</p></div><div className="rounded-xl border border-white/[.08] bg-white/[.025] p-3"><p className="text-xs text-slate-500">Telas</p><p className="mt-1 font-bold text-white">{customer.usedScreens} / {customer.screenLimit}</p></div></div><div className="flex items-start gap-3 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><CalendarDays className="mt-0.5 h-4 w-4 text-[#43E6C2]" /><div><p className="text-xs text-slate-500">Vencimento</p><p className="mt-1 font-bold text-white">{new Date(customer.expiresAt).toLocaleDateString("pt-BR")}</p><p className="mt-1 text-xs text-slate-400">{Number.isFinite(daysUntilExpiry) ? daysUntilExpiry < 0 ? `Vencida há ${Math.abs(daysUntilExpiry)} dias.` : `${daysUntilExpiry} dias restantes.` : "Data indisponível."}</p></div></div><p className="text-xs leading-5 text-slate-500">{signal.description}</p></div></DialogContent></Dialog>
    <PanelFormDialog key={`${customer.id}-${editing ? "edit" : "closed"}-${planOptions.length}`} open={editing} onOpenChange={setEditing} title={`Editar ${customer.label}`} description="Atualize perfil, plano, ciclo e status da assinatura. Alterar o plano não renova o vencimento automaticamente." fields={[{ name: "label", label: "Nome completo", defaultValue: customer.label, wide: true }, { name: "email", label: "E-mail", type: "email", defaultValue: customer.email ?? "" }, { name: "phone", label: "Telefone", defaultValue: customer.phone ?? "" }, { name: "planCycle", label: "Plano e ciclo", defaultValue: selectedPlanCycle, options: planOptions, wide: true }, { name: "status", label: "Status da assinatura", defaultValue: customer.status, options: statusOptions, wide: true }]} submitLabel="Salvar alterações" submitting={updateCustomer.isPending} onSubmit={values => { const [planId, planCycleId] = values.planCycle.split(":").map(Number); if (!planId || !planCycleId) { toast.error("Selecione um plano e ciclo válidos."); return; } updateCustomer.mutate({ id: customer.id, label: values.label.trim(), email: values.email.trim() || null, phone: values.phone.trim() || null, planId, planCycleId, status: values.status as CustomerStatus }); }} />
    <PanelConfirmDialog open={confirmRotation} onOpenChange={setConfirmRotation} title="Gerar nova senha Xtream" description={`A senha atual de ${customer.label} deixará de funcionar imediatamente em todos os acessos do aplicativo e Xtream.`} confirmLabel="Gerar nova senha" submitting={rotate.isPending} onConfirm={() => rotate.mutate({ id: customer.id })} />
    <PanelConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Excluir cliente" description={`Excluir ${customer.label}? As telas, sessões de reprodução e cobranças vinculadas também serão removidas.`} confirmLabel="Excluir cliente" tone="danger" submitting={remove.isPending} onConfirm={() => remove.mutate({ id: customer.id })} />
    <PanelAlertDialog open={Boolean(newPassword)} onOpenChange={open => { if (!open) setNewPassword(null); }} title="Nova senha Xtream" description="Copie e entregue esta senha ao cliente agora. Ela não será exibida novamente no painel." secret={newPassword} onCopy={async () => { if (newPassword) { await navigator.clipboard.writeText(newPassword); toast.success("Senha Xtream copiada."); } }} />
  </>;
}
