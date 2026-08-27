import { useState } from "react";
import { History, ReceiptText, Search } from "lucide-react";
import PanelLayout from "@/components/PanelLayout";
import { PixHistoryDialog } from "@/components/PixHistoryDialog";
import { trpc } from "@/lib/trpc";

export default function PixHistoryPage() {
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<{ id: number; label: string } | null>(null);
  const customersQuery = trpc.customers.list.useQuery();
  const customers = (customersQuery.data ?? []).filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  return <PanelLayout>
    <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#10191f] px-6 py-7 sm:px-8"><div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#43E6C2]/[0.06] blur-3xl" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2"><span className="signal-dot" /><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9df6df]">Cobranças registradas</span></div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Histórico PIX por cliente.</h1><p className="mt-3 text-sm leading-6 text-slate-300">Consulte cobranças registradas, vencimentos e o status confirmado pelo Mercado Pago sem expor credenciais do gateway.</p></div><History className="h-8 w-8 text-[#43E6C2]" /></div></section>
    <section className="surface-card mt-6 overflow-hidden"><div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Base de cobrança</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Selecione um cliente</h2></div><label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 sm:w-[270px]"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600" /></label></div>
      {customersQuery.isLoading ? <p className="px-6 py-12 text-center font-mono text-xs uppercase tracking-[.14em] text-slate-500">Carregando clientes…</p> : null}
      {customersQuery.error ? <p className="px-6 py-12 text-center text-sm text-[#ffd28b]">Não foi possível carregar a base de clientes.</p> : null}
      {!customersQuery.isLoading && !customersQuery.error && customers.length === 0 ? <div className="px-6 py-12 text-center"><ReceiptText className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhum cliente encontrado</p></div> : null}
      {!customersQuery.isLoading && !customersQuery.error && customers.length > 0 ? <div className="divide-y divide-white/[.06]">{customers.map(item => <button type="button" key={item.id} onClick={() => setCustomer({ id: item.id, label: item.label })} className="pressable flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[.025] sm:px-6"><span><span className="block text-sm font-bold text-slate-100">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.plan} · vence em {new Date(item.expiresAt).toLocaleDateString("pt-BR")}</span></span><span className="rounded-lg border border-[#43E6C2]/20 bg-[#43E6C2]/[.07] px-3 py-2 text-xs font-bold text-[#9df6df]">Ver histórico</span></button>)}</div> : null}
    </section>
    <PixHistoryDialog customer={customer} onOpenChange={open => { if (!open) setCustomer(null); }} />
  </PanelLayout>;
}
