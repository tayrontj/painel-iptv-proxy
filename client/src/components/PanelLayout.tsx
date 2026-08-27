/**
 * Estrutura administrativa da Videlis: barra lateral persistente, sinais
 * operacionais e atalhos para as áreas de IPTV, VOD e assinatura.
 */
import { Link, useLocation } from "wouter";
import {
  Activity,
  BellRing,
  Cable,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Film,
  LayoutDashboard,
  ListVideo,
  RadioTower,
  LogIn,
  Settings2,
  Smartphone,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLoginPage from "@/pages/AdminLoginPage";
import { SubscriptionPixHistory } from "@/components/SubscriptionPixHistory";

type PanelLayoutProps = {
  children: React.ReactNode;
};

export function AdminAccessGate({ children }: PanelLayoutProps) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#091013] p-6 text-slate-100"><div className="surface-card w-full max-w-md p-7 text-center"><span className="signal-dot" /><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9df6df]">Videlis</p><h1 className="mt-2 text-xl font-extrabold">Validando sessão administrativa</h1><p className="mt-3 text-sm leading-6 text-slate-400">Aguardando confirmação de identidade e permissões.</p></div></div>;
  if (user?.role !== "admin") return <AdminLoginPage />;
  return <>{children}</>;
}

const navigation: { label: string; path?: string; icon: LucideIcon }[] = [
  { label: "Visão geral", path: "/", icon: LayoutDashboard },
  { label: "Clientes", path: "/clientes", icon: UsersRound },
  { label: "Planos", path: "/planos", icon: CircleDollarSign },
  { label: "Canais ao vivo", path: "/canais", icon: RadioTower },
  { label: "Listas M3U", path: "/listas-m3u", icon: ListVideo },
  { label: "Catálogo VOD", path: "/vod", icon: Clapperboard },
  { label: "EPG", path: "/epg", icon: Activity },
  { label: "Assinaturas PIX", path: "/assinaturas", icon: CircleDollarSign },
  { label: "Histórico PIX", path: "/historico-pix", icon: CircleDollarSign },
  { label: "Atualizações Android", path: "/atualizacoes-android", icon: Smartphone },
  { label: "Configurações", path: "/integracoes", icon: Settings2 },
];

export default function PanelLayout({ children }: PanelLayoutProps) {
  const [location] = useLocation();

  const handleUnavailableSection = (label: string) => {
    toast.message(`${label} será conectado à API administrativa na próxima etapa.`, {
      description: "A estrutura de navegação já está preparada no painel.",
    });
  };

  return (
    <div className="panel-shell flex min-h-screen bg-[#091013] text-slate-100">
      <aside className="side-rail relative hidden min-h-screen w-[262px] shrink-0 overflow-hidden border-r border-white/[0.07] bg-[#0b1418] px-4 py-5 lg:flex lg:flex-col">
        <img
          src="/storage/nexus-routes-portrait_4f436c3b.jpg"
          alt=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[330px] w-full object-cover opacity-[0.14] mix-blend-screen"
        />
        <div className="relative flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#43E6C2]/25 bg-[#43E6C2]/10 shadow-[0_0_22px_rgba(67,230,194,0.08)]">
            <img
              src="/storage/nexus-frequency-mark_5dbca578.png"
              alt="Videlis"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.26em] text-[#43E6C2]">Videlis</p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight text-white">Centro de controle</p>
          </div>
        </div>

        <div className="relative mt-8 px-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Operação</p>
        </div>
        <nav className="relative mt-2 space-y-1" aria-label="Navegação principal">
          {navigation.map(item => {
            const Icon = item.icon;
            const active = item.path === location;
            const className = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-200 ${
              active
                ? "bg-[#14302f] text-white shadow-[inset_0_0_0_1px_rgba(67,230,194,0.14)]"
                : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
            }`;

            if (item.path) {
              return (
                <Link href={item.path} key={item.label} className={className}>
                  <Icon className={`h-4 w-4 ${active ? "text-[#43E6C2]" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <span className="font-medium">{item.label}</span>
                  {active ? <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#43E6C2]" /> : null}
                </Link>
              );
            }

            return (
              <button
                type="button"
                key={item.label}
                className={className}
                onClick={() => handleUnavailableSection(item.label)}
              >
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-white/[0.07] bg-black/15 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="signal-dot" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#9df6df]">Sinal estável</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">Proxy e catálogo estão sob observação administrativa.</p>
          <button
            type="button"
            onClick={() => toast.message("Central de alertas preparada para integração com o aplicativo.")}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-200 transition hover:text-[#43E6C2]"
          >
            <BellRing className="h-3.5 w-3.5" /> Rever alertas
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex min-h-[66px] items-center justify-between border-b border-white/[0.07] bg-[#091013]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-[#43E6C2]/20 bg-[#43E6C2]/10">
              <img src="/storage/nexus-frequency-mark_5dbca578.png" alt="Videlis" className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Videlis</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Cable className="h-3.5 w-3.5 text-[#43E6C2]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Ambiente de administração</span>
          </div>
          <button
            type="button"
            onClick={() => toast.message("Sem login de cliente no painel.", { description: "O acesso e os pagamentos dos clientes acontecerão no aplicativo." })}
            className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[#43E6C2]/25 hover:bg-[#43E6C2]/[0.06]"
          >
            <span className="signal-dot h-1.5 w-1.5" /> Administração local
          </button>
        </div>
        <div className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">{children}{location === "/assinaturas" ? <SubscriptionPixHistory /> : null}</div>
      </main>
    </div>
  );
}
