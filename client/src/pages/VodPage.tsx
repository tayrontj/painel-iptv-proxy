/**
 * Página de cadastro de VOD: organiza filmes, séries e novelas e deixa visível
 * o ponto de integração futuro para metadados, imagens e fontes autorizadas.
 */
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  Clapperboard,
  Film,
  ImagePlus,
  Layers3,
  Link2,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import PanelLayout from "@/components/PanelLayout";
import { getVodKindLabel, type VodKind } from "@/lib/panelModel";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { PanelConfirmDialog, PanelFormDialog } from "@/components/PanelActionDialog";
import { PencilLine, Trash2 } from "lucide-react";

const kinds: { id: VodKind; description: string; icon: typeof Film }[] = [
  { id: "filme", description: "Um título, uma reprodução", icon: Film },
  { id: "serie", description: "Temporadas e episódios", icon: Layers3 },
  { id: "novela", description: "Capítulos em sequência", icon: Clapperboard },
];

export default function VodPage() {
  const [kind, setKind] = useState<VodKind>("filme");
  const [title, setTitle] = useState("");
  const [tmdbId, setTmdbId] = useState("");
  const [year, setYear] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [ageRating, setAgeRating] = useState("0");
  const [metadataResults, setMetadataResults] = useState<Array<{ providerId: string; tmdbId: number; title: string; overview: string; releaseYear: number | null; posterUrl: string | null }>>([]);
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const catalogQuery = trpc.vod.list.useQuery();
  const [editingItem, setEditingItem] = useState<NonNullable<typeof catalogQuery.data>[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const createVod = trpc.vod.create.useMutation({
    onSuccess: async () => {
      await utils.vod.list.invalidate();
      toast.success("VOD salvo no catálogo administrativo.");
      setTitle(""); setTmdbId(""); setYear(""); setSourceUrl(""); setSynopsis(""); setPosterUrl(""); setAgeRating("0");
    },
    onError: error => toast.error(error.message),
  });
  const catalog = catalogQuery.data ?? [];
  const updateVod = trpc.vod.update.useMutation({ onSuccess: async () => { setEditingItem(null); await utils.vod.list.invalidate(); toast.success("Conteúdo atualizado."); }, onError: error => toast.error(error.message) });
  const removeVod = trpc.vod.remove.useMutation({ onSuccess: async () => { setDeleteTarget(null); await utils.vod.list.invalidate(); toast.success("Conteúdo excluído."); }, onError: error => toast.error(error.message) });

  const metadataSearch = trpc.vod.searchMetadata.useMutation({
    onSuccess: results => {
      setMetadataResults(results);
      if (!results.length) toast.message("Nenhum resultado encontrado na fonte configurada.");
    },
    onError: error => toast.error(error.message),
  });
  const metadataLookup = trpc.vod.lookupMetadata.useMutation({ onSuccess: result => applyMetadata(result), onError: error => toast.error(error.message) });

  const selectedKind = useMemo(() => kinds.find(item => item.id === kind)!, [kind]);
  const isEpisodic = kind === "serie" || kind === "novela";

  const handleMetadataSearch = () => {
    if (user?.role !== "admin") {
      toast.error("Entre como administrador para buscar metadados externos.");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Informe ao menos dois caracteres do título antes de pesquisar.");
      return;
    }
    metadataSearch.mutate({ query: title.trim() });
  };

  const applyMetadata = (result: (typeof metadataResults)[number]) => {
    setTmdbId(String(result.tmdbId));
    setTitle(result.title);
    setYear(result.releaseYear ? String(result.releaseYear) : "");
    setSynopsis(result.overview);
    setPosterUrl(result.posterUrl || "");
    setMetadataResults([]);
    toast.success("Detalhes de VOD aplicados ao formulário.");
  };

  const handleTmdbLookup = () => {
    const parsed = Number(tmdbId);
    if (!Number.isInteger(parsed) || parsed < 1) { toast.error("Informe um ID TMDB numérico válido."); return; }
    metadataLookup.mutate({ tmdbId: parsed, kind });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Informe pelo menos o título para criar um rascunho de VOD.");
      return;
    }

    const parsedYear = year.trim() ? Number(year) : null;
    if (parsedYear !== null && (!Number.isInteger(parsedYear) || parsedYear < 1888 || parsedYear > 3000)) {
      toast.error("Informe um ano de lançamento válido.");
      return;
    }
    if (sourceUrl.trim()) {
      try { new URL(sourceUrl); } catch { toast.error("Informe uma URL de reprodução válida."); return; }
    }
    const parsedTmdbId = tmdbId.trim() ? Number(tmdbId) : null;
    if (parsedTmdbId !== null && (!Number.isInteger(parsedTmdbId) || parsedTmdbId < 1)) { toast.error("Informe um ID TMDB numérico válido."); return; }
    createVod.mutate({ title: title.trim(), kind, tmdbId: parsedTmdbId, releaseYear: parsedYear, sourceUrl: sourceUrl.trim() || null, synopsis: synopsis.trim() || null, posterUrl: posterUrl || null, ageRating: Number(ageRating) });
  };

  return (
    <PanelLayout>
      <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#10191f] p-6 sm:p-8">
        <img src="/assets/nexus-epg-archive_68394a10.jpg" alt="" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-[0.16] mix-blend-screen" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2"><span className="signal-dot" /><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9df6df]">Conteúdo sob demanda</span></div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Adicionar conteúdo ao catálogo VOD.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Crie um registro para filme, série ou novela. Detalhes e capas serão enriquecidos por uma fonte externa configurada de forma segura no servidor.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.38fr)_minmax(340px,0.72fr)]">
        <article className="surface-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Novo registro</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Tipo de conteúdo</h2>
            </div>
            <div className="flex flex-wrap gap-2"><button type="button" disabled={metadataSearch.isPending} onClick={handleMetadataSearch} className="pressable inline-flex items-center gap-2 rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.07] px-3 py-2 text-xs font-bold text-[#9df6df] transition hover:bg-[#43E6C2]/[0.13] disabled:cursor-wait disabled:opacity-60"><Search className="h-3.5 w-3.5" /> {metadataSearch.isPending ? "Buscando" : "Buscar por título"}</button><button type="button" disabled={metadataLookup.isPending} onClick={handleTmdbLookup} className="pressable inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.03] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/[.07] disabled:cursor-wait disabled:opacity-60"><Link2 className="h-3.5 w-3.5" /> {metadataLookup.isPending ? "Consultando" : "Usar ID TMDB"}</button></div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de VOD">
            {kinds.map(item => {
              const Icon = item.icon;
              const active = kind === item.id;
              return (
                <button type="button" role="radio" aria-checked={active} key={item.id} onClick={() => setKind(item.id)} className={`pressable rounded-2xl border p-4 text-left transition ${active ? "border-[#43E6C2]/35 bg-[#43E6C2]/[0.08]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.045]"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-[#43E6C2]" : "text-slate-500"}`} />
                  <p className="mt-5 text-sm font-bold text-slate-100">{getVodKindLabel(item.id)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="form-label sm:col-span-2">Título
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder={`Ex.: novo ${getVodKindLabel(kind).toLowerCase()}`} className="form-input" />
            </label>
            <label className="form-label">ID TMDB <span className="normal-case tracking-normal text-slate-500">opcional</span>
              <input value={tmdbId} onChange={event => setTmdbId(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Ex.: 550" className="form-input" />
            </label>
            <label className="form-label">Ano de lançamento
              <input value={year} onChange={event => setYear(event.target.value)} inputMode="numeric" placeholder="AAAA" className="form-input" />
            </label>
            <span className="form-label">Classificação indicativa
              <Select value={ageRating} onValueChange={setAgeRating}><SelectTrigger className="h-[45px] w-full border-white/[.1] bg-white/[.035] text-slate-100 hover:bg-white/[.055]"><SelectValue /></SelectTrigger><SelectContent className="border-white/[.1] bg-[#10191f] text-slate-100">{[["0", "Livre"], ["10", "10 anos"], ["12", "12 anos"], ["14", "14 anos"], ["16", "16 anos"], ["18", "18 anos"]].map(([value, label]) => <SelectItem key={value} value={value} className="cursor-pointer text-slate-100 focus:bg-[#43E6C2]/15 focus:text-white data-[state=checked]:bg-white/[.06]">{label}</SelectItem>)}</SelectContent></Select>
            </span>
            <label className="form-label sm:col-span-2">URL de mídia ou reprodução
              <input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://origem-protegida/arquivo.mp4 ou .m3u8" className="form-input font-mono text-xs" />
            </label>
            {isEpisodic ? (
              <>
                <label className="form-label">{kind === "novela" ? "Capítulo inicial" : "Temporada"}
                  <input inputMode="numeric" placeholder={kind === "novela" ? "1" : "1"} className="form-input" />
                </label>
                <label className="form-label">{kind === "novela" ? "Capítulos previstos" : "Episódios previstos"}
                  <input inputMode="numeric" placeholder={kind === "novela" ? "160" : "10"} className="form-input" />
                </label>
              </>
            ) : null}
            <label className="form-label sm:col-span-2">Sinopse
              <textarea value={synopsis} onChange={event => setSynopsis(event.target.value)} rows={4} placeholder="Resumo editorial do conteúdo..." className="form-input min-h-28 resize-y py-3" />
            </label>
          </div>

          {metadataResults.length ? (
            <div className="mt-6 rounded-2xl border border-[#43E6C2]/15 bg-[#43E6C2]/[0.035] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9df6df]">Resultados da fonte configurada</p>
              <div className="mt-3 grid gap-2">
                {metadataResults.slice(0, 4).map(result => (
                  <button type="button" key={result.providerId} onClick={() => applyMetadata(result)} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3 text-left transition hover:border-[#43E6C2]/25 hover:bg-white/[0.035]">
                    {result.posterUrl ? <img src={result.posterUrl} alt={`Capa de ${result.title}`} className="h-14 w-10 rounded-md object-cover" /> : <div className="grid h-14 w-10 place-items-center rounded-md bg-white/[0.06]"><ImagePlus className="h-4 w-4 text-slate-500" /></div>}
                    <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-100">{result.title}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{result.overview || "Sem sinopse disponível"}</span></span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
            <p className="max-w-md text-xs leading-5 text-slate-500">A URL pode apontar para M3U8, MP4, MKV, AVI ou outro formato que o aplicativo do cliente consiga reproduzir. Apenas URLs HTTP(S) são aceitas.</p>
            <button type="button" disabled={createVod.isPending} onClick={handleSave} className="pressable inline-flex items-center gap-2 rounded-xl bg-[#43E6C2] px-4 py-3 text-sm font-bold text-[#07201c] transition hover:bg-[#72f0d5] disabled:cursor-wait disabled:opacity-60"><UploadCloud className="h-4 w-4" /> {createVod.isPending ? "Salvando" : "Salvar rascunho"}</button>
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-card overflow-hidden">
            <div className="relative min-h-[170px] overflow-hidden border-b border-white/[0.07] bg-[#0b1519] p-5">
              <img src="/assets/nexus-streamfield-wide_7bf781f7.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.18]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.08]"><ImagePlus className="h-4.5 w-4.5 text-[#43E6C2]" /></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Imagem de capa</p><p className="mt-1 text-sm font-bold text-white">{posterUrl ? "Capa selecionada" : "Aguardando fonte configurada"}</p></div>
              </div>
            </div>
            <div className="p-5">
              {posterUrl ? <img src={posterUrl} alt="Prévia da capa selecionada" className="mt-3 aspect-[2/3] w-24 rounded-lg object-cover" /> : <p className="text-sm leading-6 text-slate-400">A fonte externa poderá trazer poster, backdrop, elenco, gêneros e descrição em português. A chave nunca será entregue ao React ou ao aplicativo.</p>}
              <button type="button" onClick={handleMetadataSearch} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#9df6df] transition hover:text-white"><Link2 className="h-3.5 w-3.5" /> Configurar conexão de fonte</button>
            </div>
          </article>

          <article className="surface-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Enriquecimento previsto</p>
            <div className="mt-4 space-y-3">
              {["Busca de detalhes pelo título", "Recuperação de poster e backdrop", "Sinopse, gêneros e classificação", "Controle de origem e atualização"].map(text => (
                <div key={text} className="flex items-center gap-3"><BadgeCheck className="h-4 w-4 shrink-0 text-[#43E6C2]" /><span className="text-sm text-slate-300">{text}</span></div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mt-6 surface-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-6">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Sessão atual</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">Rascunhos adicionados</h2></div>
          <span className="font-mono text-xs text-slate-500">{catalog.length.toString().padStart(2, "0")} item(ns)</span>
        </div>
        {catalogQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><BookOpenCheck className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Carregando catálogo persistido</p></div>
        ) : catalogQuery.error ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><BookOpenCheck className="h-7 w-7 text-[#ffbb4d]" /><p className="mt-3 text-sm font-semibold text-slate-300">Não foi possível carregar o catálogo</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">Verifique o banco e tente novamente.</p></div>
        ) : catalog.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><BookOpenCheck className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhum VOD adicionado nesta sessão</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">Use o formulário acima para validar o fluxo de cadastro de filmes, séries e novelas.</p></div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {catalog.map(item => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"><div className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04]"><Sparkles className="h-3.5 w-3.5 text-[#43E6C2]" /></div><div className="min-w-[180px] flex-1"><p className="text-sm font-bold text-slate-100">{item.title}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{getVodKindLabel(item.kind)} · {item.releaseYear ?? "—"}</p></div>{item.kind !== "filme" ? <Link href={`/vod/${item.id}/episodios`} className="pressable rounded-xl border border-[#43E6C2]/20 bg-[#43E6C2]/[0.07] px-3 py-2 text-xs font-bold text-[#9df6df]">Gerenciar {item.kind === "serie" ? "episódios" : "capítulos"}</Link> : null}<span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">{item.status === "ready" ? "Pronto para publicar" : "Rascunho"}</span><button type="button" onClick={() => setEditingItem(item)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white" title="Editar conteúdo"><PencilLine className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteTarget({ id: item.id, title: item.title })} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-400/10 hover:text-[#ffaaa2]" title="Excluir conteúdo"><Trash2 className="h-4 w-4" /></button></div>
            ))}
          </div>
        )}
      </section>
      <PanelFormDialog key={editingItem ? `edit-${editingItem.id}` : "closed"} open={Boolean(editingItem)} onOpenChange={open => { if (!open) setEditingItem(null); }} title={editingItem ? `Editar ${editingItem.title}` : "Editar conteúdo"} description="Atualize os metadados e a origem de reprodução do item." fields={editingItem ? [{ name: "title", label: "Título", defaultValue: editingItem.title, wide: true }, { name: "kind", label: "Tipo", defaultValue: editingItem.kind, options: [{ value: "filme", label: "Filme" }, { value: "serie", label: "Série" }, { value: "novela", label: "Novela" }] }, { name: "tmdbId", label: "ID TMDB", defaultValue: editingItem.tmdbId ? String(editingItem.tmdbId) : "", optional: true }, { name: "releaseYear", label: "Ano", type: "number", defaultValue: editingItem.releaseYear ? String(editingItem.releaseYear) : "", optional: true }, { name: "sourceUrl", label: "URL de reprodução", defaultValue: editingItem.sourceUrl ?? "", wide: true, optional: true }, { name: "posterUrl", label: "URL do poster", defaultValue: editingItem.posterUrl ?? "", wide: true, optional: true }, { name: "ageRating", label: "Classificação", defaultValue: String(editingItem.ageRating), options: [{ value: "0", label: "Livre" }, { value: "10", label: "10 anos" }, { value: "12", label: "12 anos" }, { value: "14", label: "14 anos" }, { value: "16", label: "16 anos" }, { value: "18", label: "18 anos" }] }, { name: "synopsis", label: "Sinopse", defaultValue: editingItem.synopsis ?? "", wide: true, optional: true }] : []} submitLabel="Salvar alterações" submitting={updateVod.isPending} onSubmit={values => editingItem && updateVod.mutate({ id: editingItem.id, title: values.title.trim(), kind: values.kind as VodKind, tmdbId: values.tmdbId.trim() ? Number(values.tmdbId) : null, releaseYear: values.releaseYear.trim() ? Number(values.releaseYear) : null, sourceUrl: values.sourceUrl.trim() || null, synopsis: values.synopsis.trim() || null, posterUrl: values.posterUrl.trim() || null, ageRating: Number(values.ageRating) })} />
      <PanelConfirmDialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open) setDeleteTarget(null); }} title="Excluir conteúdo" description={deleteTarget ? `Excluir ${deleteTarget.title}? Temporadas e episódios vinculados também serão removidos.` : ""} confirmLabel="Excluir conteúdo" tone="danger" submitting={removeVod.isPending} onConfirm={() => deleteTarget && removeVod.mutate({ id: deleteTarget.id })} />
    </PanelLayout>
  );
}
