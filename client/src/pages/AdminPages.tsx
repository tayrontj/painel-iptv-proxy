/**
 * Módulos administrativos persistentes do Nexus Stream. Cada tela consome os
 * procedimentos tRPC e deixa claro quando não há registros ou uma carga falha.
 */
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  FileCheck2,
  ListFilter,
  MoreHorizontal,
  Plus,
  RadioTower,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import PanelLayout from "@/components/PanelLayout";
import { getSubscriptionSignal } from "@/lib/panelModel";
import { trpc } from "@/lib/trpc";

function daysUntil(date: Date | string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function PageHero({ eyebrow, title, description, actionLabel, onAction, disabled, icon: Icon }: { eyebrow: string; title: string; description: string; actionLabel: string; onAction: () => void; disabled?: boolean; icon: typeof UsersRound }) {
  return <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#10191f] px-6 py-7 sm:px-8"><div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#43E6C2]/[0.06] blur-3xl" /><div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><div className="flex items-center gap-2"><span className="signal-dot" /><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9df6df]">{eyebrow}</span></div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{description}</p></div><button type="button" disabled={disabled} onClick={onAction} className="pressable inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-3 text-sm font-bold text-[#07201c] transition hover:bg-[#72f0d5] disabled:cursor-wait disabled:opacity-60"><Icon className="h-4 w-4" /> {actionLabel}</button></div></section>;
}

function DataFeedback({ loading, error, empty, children }: { loading: boolean; error?: unknown; empty: boolean; children: React.ReactNode }) {
  if (loading) return <div className="px-6 py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-slate-500">Carregando registros…</div>;
  if (error) return <div className="px-6 py-12 text-center"><CircleAlert className="mx-auto h-5 w-5 text-[#ffbb4d]" /><p className="mt-3 text-sm font-semibold text-slate-200">Não foi possível carregar os dados.</p><p className="mt-1 text-xs text-slate-500">Verifique a conexão do banco e tente novamente.</p></div>;
  if (empty) return <div className="px-6 py-12 text-center"><FileCheck2 className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhum registro criado ainda</p><p className="mt-1 text-xs text-slate-500">Use a ação principal desta tela para iniciar a operação.</p></div>;
  return <>{children}</>;
}

function SignalPill({ days, forcedStatus }: { days: number; forcedStatus?: "active" | "attention" | "expired" }) {
  const signal = forcedStatus === "attention" ? { tone: "attention" as const, label: "Próxima do vencimento" } : forcedStatus === "expired" ? { tone: "expired" as const, label: "Vencida" } : getSubscriptionSignal(days);
  const style = signal.tone === "stable" ? "border-[#43E6C2]/20 bg-[#43E6C2]/[0.07] text-[#9df6df]" : signal.tone === "attention" ? "border-[#ffbb4d]/20 bg-[#ffbb4d]/[0.07] text-[#ffd28b]" : "border-[#ff6b5b]/20 bg-[#ff6b5b]/[0.07] text-[#ffaaa2]";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${style}`}>{signal.label}</span>;
}

export function CustomersPage() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const customersQuery = trpc.customers.list.useQuery();
  const createCustomer = trpc.customers.create.useMutation({ onSuccess: async () => { await utils.customers.list.invalidate(); toast.success("Cliente criado com sucesso."); }, onError: error => toast.error(error.message) });
  const setStatus = trpc.customers.setStatus.useMutation({ onSuccess: () => utils.customers.list.invalidate(), onError: error => toast.error(error.message) });
  const customers = customersQuery.data ?? [];
  const visible = useMemo(() => customers.filter(customer => customer.label.toLowerCase().includes(query.toLowerCase())), [customers, query]);
  const addCustomer = () => {
    const label = window.prompt("Informe o nome ou identificador do cliente:")?.trim();
    if (!label) return;
    createCustomer.mutate({ label, plan: "Mensal", screenLimit: 1, expiresAt: new Date(Date.now() + 30 * 86_400_000) });
  };
  const nextStatus = (status: "active" | "attention" | "expired") => status === "active" ? "attention" : status === "attention" ? "expired" : "active";

  return <PanelLayout><PageHero eyebrow="Base de clientes" title="Acompanhe acesso, ciclo e exceções." description="Clientes finais não acessam este painel. A operação controla limites de tela, vencimento e suspensão sem expor credenciais ao aplicativo." actionLabel={createCustomer.isPending ? "Criando" : "Adicionar cliente"} onAction={addCustomer} disabled={createCustomer.isPending} icon={Plus} />
    <section className="mt-6 grid gap-3 sm:grid-cols-3">{[{ label: "Base monitorada", value: customers.length.toString().padStart(2, "0"), icon: UsersRound }, { label: "Próximos do vencimento", value: customers.filter(item => item.status === "attention" || (item.status === "active" && daysUntil(item.expiresAt) <= 3)).length.toString().padStart(2, "0"), icon: Clock3 }, { label: "Acesso suspenso", value: customers.filter(item => item.status === "expired").length.toString().padStart(2, "0"), icon: CircleAlert }].map(stat => { const Icon = stat.icon; return <article className="metric-card" key={stat.label}><Icon className="h-4 w-4 text-[#43E6C2]" /><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{stat.label}</p><p className="mt-1 text-3xl font-extrabold tracking-[-0.06em] text-white">{stat.value}</p></article>; })}</section>
    <section className="surface-card mt-6 overflow-hidden"><div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Lista de controle</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Clientes cadastrados</h2></div><div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 sm:w-[270px]"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conta" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600" /></div></div><DataFeedback loading={customersQuery.isLoading} error={customersQuery.error} empty={!customers.length}><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.018]"><tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3.5 font-medium sm:px-6">Cliente</th><th className="px-5 py-3.5 font-medium">Plano</th><th className="px-5 py-3.5 font-medium">Telas</th><th className="px-5 py-3.5 font-medium">Status</th><th className="px-5 py-3.5 font-medium">Vencimento</th><th className="px-5 py-3.5 font-medium" /></tr></thead><tbody className="divide-y divide-white/[0.06]">{visible.map(customer => <tr key={customer.id} className="group text-sm text-slate-300 transition hover:bg-white/[0.025]"><td className="px-5 py-4 font-semibold text-slate-100 sm:px-6">{customer.label}</td><td className="px-5 py-4 text-slate-400">{customer.plan}</td><td className="px-5 py-4 font-mono text-xs text-slate-400">{customer.usedScreens} / {customer.screenLimit} telas</td><td className="px-5 py-4"><SignalPill days={daysUntil(customer.expiresAt)} forcedStatus={customer.status} /></td><td className="px-5 py-4 text-slate-500">{new Date(customer.expiresAt).toLocaleDateString("pt-BR")}</td><td className="px-5 py-4"><button type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: customer.id, status: nextStatus(customer.status) })} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50" title="Alterar estado da assinatura"><MoreHorizontal className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></DataFeedback></section>
  </PanelLayout>;
}

export function ChannelsPage() {
  const utils = trpc.useUtils();
  const channelsQuery = trpc.channels.list.useQuery();
  const createChannel = trpc.channels.create.useMutation({ onSuccess: () => { utils.channels.list.invalidate(); toast.success("Canal criado como pausado."); }, onError: error => toast.error(error.message) });
  const toggleChannel = trpc.channels.toggle.useMutation({ onSuccess: () => utils.channels.list.invalidate(), onError: error => toast.error(error.message) });
  const channels = channelsQuery.data ?? [];
  const addChannel = () => { const name = window.prompt("Nome do canal:")?.trim(); if (!name) return; createChannel.mutate({ name, groupTitle: "Sem grupo", qualities: "HD" }); };
  return <PanelLayout><PageHero eyebrow="Orquestração de live TV" title="Canais com rotas, qualidade e fallback." description="A operação mantém as rotas e qualidades publicadas. URLs de origem devem ficar no servidor e nunca ser devolvidas ao aplicativo." actionLabel={createChannel.isPending ? "Criando" : "Criar canal"} onAction={addChannel} disabled={createChannel.isPending} icon={Plus} />
    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><article className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Canais persistidos</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Matriz de distribuição</h2></div><span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-400"><ListFilter className="h-3.5 w-3.5" /> {channels.length} canal(is)</span></div><DataFeedback loading={channelsQuery.isLoading} error={channelsQuery.error} empty={!channels.length}><div className="divide-y divide-white/[0.06]">{channels.map(channel => <div key={channel.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-6"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${channel.isActive ? "border-[#43E6C2]/20 bg-[#43E6C2]/[0.08]" : "border-white/[0.08] bg-white/[0.035]"}`}><RadioTower className={`h-4 w-4 ${channel.isActive ? "text-[#43E6C2]" : "text-slate-500"}`} /></div><div className="min-w-[155px] flex-1"><p className="text-sm font-bold text-slate-100">{channel.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{channel.groupTitle} · {channel.qualities}</p></div><div className="min-w-[90px]"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Rotas</p><p className="mt-1 text-sm text-slate-200">{channel.routeCount} fonte(s)</p></div><button type="button" disabled={toggleChannel.isPending} onClick={() => toggleChannel.mutate({ id: channel.id, isActive: !channel.isActive })} className={`pressable rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] ${channel.isActive ? "border-[#43E6C2]/20 bg-[#43E6C2]/[0.07] text-[#9df6df]" : "border-white/[0.1] bg-white/[0.035] text-slate-500"}`}>{channel.isActive ? "Publicado" : "Pausado"}</button></div>)}</div></DataFeedback></article><aside className="surface-card relative overflow-hidden p-5"><img src="/manus-storage/nexus-routes-portrait_4f436c3b.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]" /><div className="relative"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Proteção de origem</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Manifest proxy</h2><div className="mt-7 space-y-5">{[["1", "Cliente solicita uma rota do painel"], ["2", "Proxy decide qualidade e fallback"], ["3", "Manifesto é entregue sem expor a origem"]].map(([n, text]) => <div key={n} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#43E6C2]/20 bg-[#43E6C2]/[0.08] font-mono text-[10px] text-[#9df6df]">{n}</span><p className="pt-0.5 text-sm leading-5 text-slate-300">{text}</p></div>)}</div><span className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-[#9df6df]"><Settings2 className="h-3.5 w-3.5" /> Rotas protegidas no servidor</span></div></aside></section>
  </PanelLayout>;
}

export function EpgPage() {
  const utils = trpc.useUtils();
  const sourcesQuery = trpc.epg.list.useQuery();
  const createSource = trpc.epg.create.useMutation({ onSuccess: () => { utils.epg.list.invalidate(); toast.success("Fonte EPG adicionada como inativa."); }, onError: error => toast.error(error.message) });
  const markSync = trpc.epg.markSync.useMutation({ onSuccess: () => { utils.epg.list.invalidate(); toast.success("Data de sincronização registrada."); }, onError: error => toast.error(error.message) });
  const sources = sourcesQuery.data ?? [];
  const addSource = () => { const name = window.prompt("Nome de referência para a fonte XMLTV:")?.trim(); if (!name) return; createSource.mutate({ name }); };
  return <PanelLayout><PageHero eyebrow="Guia de programação" title="Fontes XMLTV sob leitura contínua." description="O painel registra fontes e sincronizações. O processador de XMLTV poderá atualizar essa leitura sem carregar o arquivo inteiro na memória." actionLabel={createSource.isPending ? "Criando" : "Adicionar fonte"} onAction={addSource} disabled={createSource.isPending} icon={Plus} />
    <section className="mt-6 grid gap-3 sm:grid-cols-3">{[{ label: "Programas indexados", value: sources.reduce((total, item) => total + item.programmeCount, 0).toLocaleString("pt-BR"), icon: FileCheck2 }, { label: "Fontes ativas", value: sources.filter(item => item.status === "healthy").length.toString().padStart(2, "0"), icon: RadioTower }, { label: "Fontes totais", value: sources.length.toString().padStart(2, "0"), icon: Clock3 }].map(stat => { const Icon = stat.icon; return <article className="metric-card" key={stat.label}><Icon className="h-4 w-4 text-[#43E6C2]" /><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{stat.label}</p><p className="mt-1 text-3xl font-extrabold tracking-[-0.06em] text-white">{stat.value}</p></article>; })}</section>
    <section className="surface-card mt-6 overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-5 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Origem de dados</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Fontes XMLTV</h2></div><DataFeedback loading={sourcesQuery.isLoading} error={sourcesQuery.error} empty={!sources.length}><div className="divide-y divide-white/[0.06]">{sources.map(source => <div key={source.id} className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6"><div className={`h-2 w-2 rounded-full ${source.status === "healthy" ? "bg-[#43E6C2] shadow-[0_0_12px_rgba(67,230,194,.5)]" : source.status === "attention" ? "bg-[#ffbb4d]" : "bg-slate-600"}`} /><div className="min-w-[165px] flex-1"><p className="text-sm font-bold text-slate-100">{source.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{source.programmeCount.toLocaleString("pt-BR")} programas</p></div><p className="text-sm text-slate-400">{source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString("pt-BR") : "Ainda não sincronizada"}</p><button type="button" disabled={markSync.isPending} onClick={() => markSync.mutate({ id: source.id })} className="pressable rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-[#43E6C2]/30 hover:text-[#9df6df]">Sincronizar</button></div>)}</div></DataFeedback></section>
  </PanelLayout>;
}

export function SubscriptionsPage() {
  const customersQuery = trpc.customers.list.useQuery();
  const customers = customersQuery.data ?? [];
  return <PanelLayout><PageHero eyebrow="Cobrança recorrente" title="Assinaturas controladas por PIX no aplicativo." description="O painel determina o estado de cada assinatura; o aplicativo exibe QR Code, código PIX e alertas de vencimento ou bloqueio." actionLabel="Mercado Pago pendente" onAction={() => undefined} disabled icon={Copy} />
    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><article className="surface-card overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-5 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Ciclo de cobrança</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Estados aplicáveis ao aplicativo</h2></div><DataFeedback loading={customersQuery.isLoading} error={customersQuery.error} empty={!customers.length}><div className="divide-y divide-white/[0.06]">{customers.map(customer => { const days = daysUntil(customer.expiresAt); const signal = getSubscriptionSignal(days); return <div key={customer.id} className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${customer.status === "active" ? "border-[#43E6C2]/20 bg-[#43E6C2]/[0.08]" : customer.status === "attention" ? "border-[#ffbb4d]/20 bg-[#ffbb4d]/[0.08]" : "border-[#ff6b5b]/20 bg-[#ff6b5b]/[0.08]"}`}><CalendarDays className={`h-4 w-4 ${customer.status === "active" ? "text-[#43E6C2]" : customer.status === "attention" ? "text-[#ffbb4d]" : "text-[#ff6b5b]"}`} /></div><div className="min-w-[150px] flex-1"><p className="text-sm font-bold text-slate-100">{customer.label}</p><p className="mt-1 text-xs text-slate-500">{customer.plan} · {signal.description}</p></div><SignalPill days={days} forcedStatus={customer.status} /><span className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-500">QR Code via app</span></div>; })}</div></DataFeedback></article><aside className="surface-card p-5"><ShieldCheck className="h-5 w-5 text-[#43E6C2]" /><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Contrato para o app</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Alertas sem login no painel</h2><div className="mt-5 space-y-4">{["Ativa: acesso permitido, sem alerta.", "Próxima do vencimento: popup com CTA para pagar.", "Vencida: acesso suspenso e QR Code PIX disponível."].map(item => <div className="flex gap-3" key={item}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#43E6C2]" /><p className="text-sm leading-5 text-slate-300">{item}</p></div>)}</div><div className="mt-6 rounded-xl border border-[#ffbb4d]/15 bg-[#ffbb4d]/[0.06] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#ffd28b]">Pendente de configuração</p><p className="mt-1.5 text-xs leading-5 text-slate-400">A geração real depende do token do Mercado Pago e da URL de webhook configurados no servidor.</p></div></aside></section>
  </PanelLayout>;
}
