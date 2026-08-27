import { CalendarDays, CircleAlert, ReceiptText, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

type PixHistoryDialogProps = {
  customer: { id: number; label: string } | null;
  onOpenChange: (open: boolean) => void;
};

const statusPresentation = {
  approved: { label: "Aprovado", classes: "border-[#43E6C2]/20 bg-[#43E6C2]/[.08] text-[#9df6df]" },
  pending: { label: "Pendente", classes: "border-[#ffbb4d]/20 bg-[#ffbb4d]/[.08] text-[#ffd28b]" },
  expired: { label: "Vencido", classes: "border-[#ff6b5b]/20 bg-[#ff6b5b]/[.08] text-[#ffaaa2]" },
  cancelled: { label: "Cancelado", classes: "border-white/[.1] bg-white/[.04] text-slate-400" },
} as const;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PixHistoryDialog({ customer, onOpenChange }: PixHistoryDialogProps) {
  const chargesQuery = trpc.billing.listForCustomer.useQuery({ customerId: customer?.id ?? 1 }, { enabled: Boolean(customer) });
  const charges = chargesQuery.data ?? [];

  return <Dialog open={Boolean(customer)} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-1.5rem)] flex-col border-white/[.1] bg-[#10191f] p-0 text-slate-100 sm:max-w-xl">
      <div className="shrink-0 border-b border-white/[.07] px-5 py-4">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#9df6df]">Cobranças registradas</p>
          <DialogTitle className="text-lg font-extrabold text-white">Histórico PIX de {customer?.label ?? "cliente"}</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">Acompanhe os status confirmados pelo Mercado Pago e as datas de expiração de cada cobrança.</DialogDescription>
        </DialogHeader>
      </div>
      <div className="min-h-0 overflow-y-auto p-5">
        {chargesQuery.isLoading ? <p className="py-8 text-center font-mono text-xs uppercase tracking-[.14em] text-slate-500">Carregando cobranças…</p> : null}
        {chargesQuery.error ? <div className="py-8 text-center"><CircleAlert className="mx-auto h-5 w-5 text-[#ffbb4d]" /><p className="mt-3 text-sm font-semibold text-slate-200">Não foi possível carregar o histórico.</p></div> : null}
        {!chargesQuery.isLoading && !chargesQuery.error && charges.length === 0 ? <div className="py-8 text-center"><ReceiptText className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhuma cobrança PIX registrada</p><p className="mt-1 text-xs text-slate-500">Gere uma cobrança para começar o histórico deste cliente.</p></div> : null}
        {!chargesQuery.isLoading && !chargesQuery.error && charges.length > 0 ? <div className="space-y-3">{charges.map(charge => {
          const status = statusPresentation[charge.status];
          return <article key={charge.id} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-100">{money.format(charge.amountCents / 100)}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">Cobrança {charge.providerPaymentId ?? `local-${charge.id}`}</p></div><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${status.classes}`}>{status.label}</span></div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />Vence em {new Date(charge.dueAt).toLocaleString("pt-BR")}</div>
          </article>;
        })}</div> : null}
      </div>
      <div className="shrink-0 border-t border-white/[.07] px-5 py-4"><button type="button" onClick={() => onOpenChange(false)} className="pressable ml-auto inline-flex items-center gap-2 rounded-xl border border-white/[.1] px-4 py-2.5 text-sm font-bold text-slate-200"><X className="h-4 w-4" /> Fechar</button></div>
    </DialogContent>
  </Dialog>;
}
