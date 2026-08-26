import { useMemo, useState } from "react";
import { Copy, ListVideo } from "lucide-react";
import { toast } from "sonner";
import PanelLayout from "@/components/PanelLayout";

export default function M3uPage() {
  const [token, setToken] = useState("");
  const url = useMemo(() => token.trim() ? `${window.location.origin}/api/m3u?token=${encodeURIComponent(token.trim())}` : "", [token]);
  return <PanelLayout><section className="rounded-[26px] border border-white/[0.08] bg-[#10191f] p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9df6df]">Compatibilidade externa</p><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-white">Gerar lista M3U.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Use o token de ativação exibido ao criar o cliente. O aplicativo oficial não precisa desta lista: ele usa a API própria do Nexus Stream.</p><label className="form-label mt-7 block max-w-2xl">Token de ativação do cliente<input value={token} onChange={event => setToken(event.target.value)} placeholder="Cole o token gerado no cadastro do cliente" className="form-input mt-2 font-mono text-xs" /></label>{url ? <div className="mt-5 max-w-2xl rounded-2xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.05] p-4"><div className="flex items-center gap-2"><ListVideo className="h-4 w-4 text-[#43E6C2]" /><p className="text-sm font-bold text-slate-100">Lista pronta para copiar</p></div><code className="mt-3 block break-all text-xs text-slate-300">{url}</code><button type="button" onClick={async () => { await navigator.clipboard.writeText(url); toast.success("URL M3U copiada."); }} className="pressable mt-4 inline-flex items-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-2.5 text-sm font-bold text-[#07201c]"><Copy className="h-4 w-4" /> Copiar URL M3U</button></div> : null}</section></PanelLayout>;
}
