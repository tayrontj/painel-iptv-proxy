/**
 * Página de visão geral do Nexus Stream: telemetria de sinal, saúde do proxy,
 * assinaturas PIX e a sequência operacional que será consumida pelo aplicativo.
 */
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  CreditCard,
  Gauge,
  Layers3,
  MoreHorizontal,
  PlaySquare,
  Plus,
  RadioTower,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import PanelLayout from "@/components/PanelLayout";
import { getSubscriptionSignal } from "@/lib/panelModel";

const streamSeries = [
  { hour: "00", sessions: 68 },
  { hour: "04", sessions: 52 },
  { hour: "08", sessions: 88 },
  { hour: "12", sessions: 142 },
  { hour: "16", sessions: 186 },
  { hour: "20", sessions: 164 },
  { hour: "agora", sessions: 171 },
];

const metrics = [
  { label: "Clientes ativos", value: "1.284", detail: "+4,8% no ciclo", icon: UsersRound, trend: "up" },
  { label: "Conexões agora", value: "171", detail: "93,6% dentro do limite", icon: RadioTower, trend: "up" },
  { label: "Uso de banda", value: "4,7 TB", detail: "Últimas 24 horas", icon: Gauge, trend: "neutral" },
  { label: "Testes ativos", value: "23", detail: "Expiram em até 12h", icon: Clock3, trend: "down" },
] as const;

const proxyEvents = [
  { time: "09:42:13", name: "Canal HD: playlist renovada", state: "ok" },
  { time: "09:37:45", name: "Fallback acionado em 1 qualidade", state: "attention" },
  { time: "09:31:02", name: "Fonte EPG: sincronização concluída", state: "ok" },
  { time: "09:28:19", name: "Novo teste gerado com validade de 6h", state: "neutral" },
];

const subscriptionExamples = [
  { customer: "Conta #A0198", days: 14, plan: "Plano mensal" },
  { customer: "Conta #C1044", days: 2, plan: "Plano trimestral" },
  { customer: "Conta #H0217", days: -1, plan: "Plano mensal" },
];

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;
  const trendIcon = metric.trend === "up" ? ArrowUpRight : metric.trend === "down" ? ArrowDownRight : Activity;
  const TrendIcon = trendIcon;

  return (
    <article className="metric-card fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.045]">
          <Icon className="h-4.5 w-4.5 text-[#43E6C2]" />
        </div>
        <TrendIcon className={`h-4 w-4 ${metric.trend === "down" ? "text-[#ffbb4d]" : "text-[#43E6C2]"}`} />
      </div>
      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{metric.label}</p>
      <p className="mt-1.5 text-3xl font-extrabold tracking-[-0.06em] text-white">{metric.value}</p>
      <p className="mt-2 text-xs text-slate-400">{metric.detail}</p>
    </article>
  );
}

export default function Home() {
  return (
    <PanelLayout>
      <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0e1a1e] px-6 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:px-8 sm:py-8">
        <img
          src="/storage/nexus-streamfield-wide_7bf781f7.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="signal-dot" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9df6df]">Operação normal</span>
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-extrabold tracking-[-0.065em] text-white sm:text-4xl">O sinal está estável.<br />Observe as exceções.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">Visão consolidada para clientes, conteúdo, proxy HLS e o fluxo de cobranças consumido pelo seu aplicativo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/vod" className="pressable inline-flex items-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-3 text-sm font-bold text-[#07201c] shadow-[0_8px_30px_rgba(67,230,194,0.14)] transition hover:bg-[#72f0d5]">
              <Plus className="h-4 w-4" /> Adicionar VOD
            </Link>
            <button
              type="button"
              onClick={() => toast.message("Atualização visual concluída.", { description: "A conexão com as fontes será configurada com suas credenciais." })}
              className="pressable inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-black/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.07]"
            >
              <RefreshCcw className="h-4 w-4" /> Atualizar leitura
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Resumo da operação</p>
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Demonstração</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">UTC−03:00 · atualização visual</span>
      </div>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.76fr)]">
        <article className="surface-card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Telemetria</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Sessões por intervalo</h2>
            </div>
            <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/15 p-1">
              <button type="button" className="rounded-md bg-white/[0.09] px-2.5 py-1.5 font-mono text-[10px] text-white">24H</button>
              <button type="button" onClick={() => toast.message("Filtro semanal disponível com dados da API.")} className="rounded-md px-2.5 py-1.5 font-mono text-[10px] text-slate-500 transition hover:text-slate-300">7D</button>
            </div>
          </div>
          <div className="h-[250px] px-2 pt-5 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={streamSeries} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessionFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#43E6C2" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#43E6C2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                <Tooltip
                  cursor={{ stroke: "rgba(67,230,194,0.18)", strokeDasharray: "3 4" }}
                  contentStyle={{ background: "#0b1418", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, color: "#f8fafc", fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8", fontFamily: "IBM Plex Mono", fontSize: 10 }}
                />
                <Area type="monotone" dataKey="sessions" stroke="#43E6C2" strokeWidth={2} fill="url(#sessionFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-[#43E6C2]/10 bg-[#43E6C2]/[0.045] p-3 sm:mx-6">
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#43E6C2]" />
            <p className="text-xs leading-5 text-slate-300">171 conexões encontram-se dentro dos limites configurados. Nenhuma fonte crítica permanece sem resposta.</p>
          </div>
        </article>

        <article className="surface-card relative overflow-hidden">
          <img src="/storage/nexus-network-topology_a6590bd9.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
          <div className="relative border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Registro operacional</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Últimos sinais</h2>
          </div>
          <div className="relative divide-y divide-white/[0.06] px-5 sm:px-6">
            {proxyEvents.map(event => (
              <div key={event.time} className="flex gap-3 py-4">
                <div className="pt-1"><span className={`block h-2 w-2 rounded-full ${event.state === "ok" ? "bg-[#43E6C2] shadow-[0_0_10px_rgba(67,230,194,.45)]" : event.state === "attention" ? "bg-[#ffbb4d]" : "bg-slate-500"}`} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-slate-200">{event.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => toast.message("A central de eventos será preenchida pelo monitor do proxy.")} className="relative mx-5 mb-5 mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#9df6df] transition hover:text-white sm:mx-6">
            Ver monitor completo <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <article className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Assinaturas</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Sinais que o aplicativo deve exibir</h2>
            </div>
            <span className="rounded-lg border border-[#ffbb4d]/20 bg-[#ffbb4d]/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#ffd28b]">PIX / Mercado Pago</span>
          </div>
          <div className="px-5 py-2 sm:px-6">
            {subscriptionExamples.map(item => {
              const signal = getSubscriptionSignal(item.days);
              const color = signal.tone === "stable" ? "text-[#9df6df] bg-[#43E6C2]/[0.08] border-[#43E6C2]/15" : signal.tone === "attention" ? "text-[#ffd28b] bg-[#ffbb4d]/[0.08] border-[#ffbb4d]/15" : "text-[#ffaaa2] bg-[#ff6b5b]/[0.08] border-[#ff6b5b]/15";
              return (
                <div key={item.customer} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/[0.06] py-4 last:border-0">
                  <div className="min-w-[115px]">
                    <p className="font-mono text-[10px] text-slate-400">{item.customer}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.plan}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">{signal.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{signal.description}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${color}`}>{signal.tone === "stable" ? "OK" : signal.tone === "attention" ? "AVISAR" : "BLOQUEAR"}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#43E6C2]/15 bg-[#43E6C2]/[0.07]"><CreditCard className="h-4.5 w-4.5 text-[#43E6C2]" /></div>
            <MoreHorizontal className="h-5 w-5 text-slate-600" />
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Fluxo de cobrança</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white">PIX controlado pelo app</h2>
          <div className="mt-5 space-y-0">
            {["App solicita cobrança", "API cria QR Code PIX", "Mercado Pago confirma", "Assinatura é atualizada"].map((step, index) => (
              <div className="flex gap-3" key={step}>
                <div className="flex flex-col items-center"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#43E6C2]/25 bg-[#43E6C2]/10 font-mono text-[9px] text-[#9df6df]">{index + 1}</span>{index < 3 ? <span className="h-6 border-l border-dashed border-white/[0.16]" /> : null}</div>
                <p className="pb-4 pt-0.5 text-sm text-slate-300">{step}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => toast.message("A geração real do QR Code será liberada depois de configurar o token e o webhook do Mercado Pago.")} className="pressable mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.08] px-4 py-3 text-sm font-bold text-[#9df6df] transition hover:bg-[#43E6C2]/[0.14]">
            <PlaySquare className="h-4 w-4" /> Preparar cobrança PIX
          </button>
        </article>
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs leading-5 text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#43E6C2]" />
        <p>Esta interface não inclui login de usuário final. O aplicativo será responsável por apresentar QR Code PIX, estado de pagamento e alertas popup de assinatura próxima do vencimento ou vencida.</p>
      </div>
    </PanelLayout>
  );
}
