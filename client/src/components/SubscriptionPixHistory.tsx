import { useState } from "react";
import { History, ReceiptText } from "lucide-react";
import { PixHistoryDialog } from "@/components/PixHistoryDialog";
import { trpc } from "@/lib/trpc";

export function SubscriptionPixHistory() {
  const [customer, setCustomer] = useState<{ id: number; label: string } | null>(null);
  const customersQuery = trpc.customers.list.useQuery();
  const customers = customersQuery.data ?? [];

  return <section className="surface-card mt-6 overflow-hidden">
    <div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-5 sm:px-6"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[.07]"><History className="h-4 w-4 text-[#43E6C2]" /></div><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-slate-500">Consulta persistente</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Histórico de cobranças PIX</h2></div></div>
    {customersQuery.isLoading ? <p className="px-6 py-10 text-center font-mono text-xs uppercase tracking-[.14em] text-slate-500">Carregando clientes…</p> : null}
    {customersQuery.error ? <p className="px-6 py-10 text-center text-sm text-[#ffd28b]">Não foi possível carregar os clientes para consulta.</p> : null}
    {!customersQuery.isLoading && !customersQuery.error && customers.length === 0 ? <div className="px-6 py-10 text-center"><ReceiptText className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhum cliente com cobrança disponível</p></div> : null}
    {!customersQuery.isLoading && !customersQuery.error && customers.length > 0 ? <div className="divide-y divide-white/[.06]">{customers.map(item => <button type="button" key={item.id} onClick={() => setCustomer({ id: item.id, label: item.label })} className="pressable flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[.025] sm:px-6"><span><span className="block text-sm font-bold text-slate-100">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.plan} · vence em {new Date(item.expiresAt).toLocaleDateString("pt-BR")}</span></span><span className="rounded-lg border border-[#43E6C2]/20 bg-[#43E6C2]/[.07] px-3 py-2 text-xs font-bold text-[#9df6df]">Ver cobranças</span></button>)}</div> : null}
    <PixHistoryDialog customer={customer} onOpenChange={open => { if (!open) setCustomer(null); }} />
  </section>;
}
