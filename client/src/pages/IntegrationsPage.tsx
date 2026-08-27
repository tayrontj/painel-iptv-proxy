/**
 * Área protegida de configurações: aceita tokens apenas em ações explícitas de
 * administrador e recebe de volta somente o indicador mascarado do segredo.
 */
import { useState } from "react";
import { CheckCircle2, CreditCard, DatabaseZap, KeyRound, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import PanelLayout from "@/components/PanelLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type IntegrationCardProps = {
  title: string;
  description: string;
  provider: "mercado_pago" | "vod_metadata";
  icon: typeof CreditCard;
  defaultUrl?: string;
  current?: { enabled: boolean; baseUrl: string | null; secretHint: string | null };
};

function IntegrationCard({ title, description, provider, icon: Icon, defaultUrl = "", current }: IntegrationCardProps) {
  const utils = trpc.useUtils();
  const [token, setToken] = useState("");
  const [baseUrl, setBaseUrl] = useState(current?.baseUrl ?? defaultUrl);
  const [enabled, setEnabled] = useState(current?.enabled ?? false);
  const save = trpc.integrations.save.useMutation({
    onSuccess: async () => {
      setToken("");
      await utils.integrations.list.invalidate();
      toast.success(`${title} atualizado com segurança.`);
    },
    onError: error => toast.error(error.message),
  });

  const submit = () => {
    if (baseUrl.trim()) {
      try { new URL(baseUrl); } catch { toast.error("Informe uma URL base válida."); return; }
    }
    if (enabled && !token && !current?.secretHint) {
      toast.error("Cadastre um token antes de ativar a integração.");
      return;
    }
    save.mutate({ provider, label: title, baseUrl: baseUrl.trim() || null, enabled, secret: token.trim() || null });
  };

  return <article className="surface-card overflow-hidden"><div className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.08]"><Icon className="h-4.5 w-4.5 text-[#43E6C2]" /></div><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em] ${current?.enabled ? "border-[#43E6C2]/20 bg-[#43E6C2]/[0.07] text-[#9df6df]" : "border-white/[0.09] bg-white/[0.025] text-slate-500"}`}>{current?.enabled ? "Ativa" : "Não configurada"}</span></div><div className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Integração externa</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p><div className="mt-6 grid gap-4"><label className="form-label">URL base da API<input value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="https://api.exemplo.com" className="form-input normal-case" /></label><label className="form-label">Token de acesso <span className="normal-case tracking-normal text-slate-500">{current?.secretHint ? `Token cadastrado: ${current.secretHint}` : "Nenhum token cadastrado"}</span><input value={token} onChange={event => setToken(event.target.value)} type="password" autoComplete="new-password" placeholder="Cole apenas para salvar ou trocar" className="form-input normal-case" /></label><label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-sm text-slate-300"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} className="h-4 w-4 accent-[#43E6C2]" /> Ativar esta integração</label></div><button type="button" disabled={save.isPending} onClick={submit} className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-3 text-sm font-bold text-[#07201c] transition hover:bg-[#72f0d5] disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" /> {save.isPending ? "Salvando" : "Salvar configuração"}</button></div></article>;
}

export default function IntegrationsPage() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";
  const integrations = trpc.integrations.list.useQuery(undefined, { enabled: isAdmin });
  const saved = integrations.data ?? [];
  const mercadoPago = saved.find(item => item.provider === "mercado_pago");
  const vodMetadata = saved.find(item => item.provider === "vod_metadata");

  if (loading) return <PanelLayout><div className="surface-card px-6 py-16 text-center font-mono text-xs uppercase tracking-[0.15em] text-slate-500">Verificando acesso administrativo…</div></PanelLayout>;
  if (!isAdmin) return <PanelLayout><section className="surface-card mx-auto max-w-2xl px-6 py-12 text-center sm:px-10"><LockKeyhole className="mx-auto h-9 w-9 text-[#43E6C2]" /><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Área protegida</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-white">As integrações só podem ser configuradas por um administrador.</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">Tokens de gateways e fontes de metadados não são expostos ao aplicativo, aos clientes ou a usuários sem permissão administrativa.</p><button type="button" onClick={() => navigate("/")} className="pressable mt-7 inline-flex items-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-3 text-sm font-bold text-[#07201c]"><KeyRound className="h-4 w-4" /> Abrir login administrativo</button></section></PanelLayout>;

  return <PanelLayout><section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#10191f] px-6 py-7 sm:px-8"><div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#43E6C2]/[0.06] blur-3xl" /><div className="relative max-w-3xl"><div className="flex items-center gap-2"><span className="signal-dot" /><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9df6df]">Administração segura</span></div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Conecte serviços sem colocar segredos no código.</h1><p className="mt-3 text-sm leading-6 text-slate-300">Os tokens são enviados apenas quando você escolhe salvar, cifrados no servidor e devolvidos ao painel somente como indicador mascarado.</p></div></section><div className="mt-6 grid gap-6 lg:grid-cols-2">{integrations.error ? <div className="surface-card px-6 py-10 text-center text-sm text-[#ffd28b]">Não foi possível carregar as integrações cadastradas.</div> : <><IntegrationCard title="Mercado Pago" description="Recebe o token que será usado pelo servidor para criar cobranças PIX, consultar pagamentos e processar confirmações via webhook." provider="mercado_pago" icon={CreditCard} defaultUrl="https://api.mercadopago.com" current={mercadoPago} /><IntegrationCard title="Fonte de metadados VOD" description="Conecta a fonte escolhida para buscar título, capa, sinopse e informações de filmes, séries e novelas no momento do cadastro." provider="vod_metadata" icon={DatabaseZap} defaultUrl="https://api.themoviedb.org/3" current={vodMetadata} /></>}</div><section className="mt-6 grid gap-3 sm:grid-cols-3">{[[LockKeyhole, "Sem segredo no React", "O cliente nunca recebe o token salvo."], [ShieldCheck, "Cifrado no servidor", "O valor é protegido antes da persistência."], [CheckCircle2, "Configuração rastreável", "O painel indica apenas a situação e a máscara do token."]].map(([Icon, title, text]) => { const CardIcon = Icon as typeof LockKeyhole; return <article key={String(title)} className="surface-card p-5"><CardIcon className="h-4 w-4 text-[#43E6C2]" /><p className="mt-5 text-sm font-bold text-white">{title as string}</p><p className="mt-2 text-xs leading-5 text-slate-500">{text as string}</p></article>; })}</section></PanelLayout>;
}
