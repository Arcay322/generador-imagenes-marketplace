"use client";

import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import {
  VIEWS,
  MODEL_OPTIONS,
  MODELS,
  ASPECT_RATIOS,
  BACKGROUND_STYLES,
  MARKETPLACE_PRESETS,
  LOGO_POSITIONS,
  type ViewInfo,
  type ViewKey,
  type ModelKey,
  type AspectRatio,
  type BackgroundStyleKey,
  type LogoPosition,
} from "@/lib/constants";
import {
  compressImage,
  dataUrlFromResult,
  triggerDownload,
  sanitizeFilename,
  overlayLogoOnImage,
  type CompressedImage,
} from "@/lib/client/image";
import { saveGeneration, type SavedGeneration } from "@/lib/client/storage";
import { ImageLightboxModal } from "@/app/components/ImageLightboxModal";
import { HistoryDrawer } from "@/app/components/HistoryDrawer";
import { UploadZone } from "@/app/components/UploadZone";
import { ResultSlot, Spinner, type CardState } from "@/app/components/ResultSlot";
import { buildPrompt } from "@/lib/prompts";
import {
  Sparkles,
  Box,
  History,
  LogOut,
  CheckCircle2,
  Wand2,
  User,
  Ruler,
  Package,
  Crosshair,
  Store,
  ShieldCheck,
  Flame,
  Cpu,
  Maximize2,
  Activity,
  Copy,
  CopyCheck,
} from "lucide-react";
import { useAuth, doLogout } from "./components/AuthProvider";
import { LoginGate } from "./components/LoginGate";
import { CreditsBadge } from "./components/CreditsBadge";

export default function Home() {
  const { user, loading } = useAuth();

  const [photo, setPhoto] = useState<CompressedImage | null>(null);
  const [name, setName] = useState("");
  const [size, setSize] = useState("27 cm");
  const [logo, setLogo] = useState<CompressedImage | null>(null);

  const [model, setModel] = useState<ModelKey>("flash");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyleKey>("estudio");
  const [customInstructions, setCustomInstructions] = useState("");

  const [logoMode, setLogoMode] = useState<"canvas" | "ai">("canvas");
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");

  const [selectedViews, setSelectedViews] = useState<Record<ViewKey, boolean>>(
    () => Object.fromEntries(VIEWS.map((v) => [v.key, true])) as Record<ViewKey, boolean>,
  );
  const [logoEnabled, setLogoEnabled] = useState<Record<ViewKey, boolean>>(
    () => Object.fromEntries(VIEWS.map((v) => [v.key, v.withLogo])) as Record<ViewKey, boolean>,
  );

  const [cards, setCards] = useState<Record<ViewKey, CardState>>(() =>
    Object.fromEntries(VIEWS.map((v) => [v.key, { state: "idle" }])) as Record<ViewKey, CardState>,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    viewInfo: ViewInfo;
    cardState: Extract<CardState, { state: "done" }>;
  } | null>(null);

  const copyPromptsForGeminiChat = async () => {
    const active = VIEWS.filter((v) => selectedViews[v.key]);
    const text = active
      .map((v) => {
        const prompt = buildPrompt({
          view: v.key,
          name: name || "Figura 3D",
          size: size || "27 cm",
          withLogo: false,
          backgroundStyle,
          customInstructions,
        });
        return `=== VISTA: ${v.label} ===\n${prompt}\n`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompts(true);
      setTimeout(() => setCopiedPrompts(false), 3000);
    } catch {
      setGlobalError("No se pudo copiar al portapapeles.");
    }
  };

  const onPhotoChange = async (file: File | undefined | null) => {
    if (!file) {
      setPhoto(null);
      return;
    }
    try {
      const compressed = await compressImage(file, { maxDimension: 1536, format: "jpeg", quality: 0.85 });
      setPhoto(compressed);
      setGlobalError(null);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al leer la foto.");
    }
  };

  const onLogoChange = async (file: File | undefined | null) => {
    if (!file) {
      setLogo(null);
      return;
    }
    try {
      const keepPng = file.type === "image/png";
      const compressed = await compressImage(file, { maxDimension: 512, format: keepPng ? "png" : "jpeg", quality: 0.9 });
      setLogo(compressed);
      setGlobalError(null);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al leer el logo.");
    }
  };

  const toggleView = (key: ViewKey) => setSelectedViews((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleLogoOnView = (key: ViewKey) => setLogoEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const generateView = useCallback(
    async (view: ViewInfo) => {
      if (!photo || !user) return;
      const shouldIncludeLogo = logoEnabled[view.key] && !!logo;
      const useAiLogo = shouldIncludeLogo && logoMode === "ai";
      const useCanvasLogo = shouldIncludeLogo && logoMode === "canvas";

      setCards((prev) => ({ ...prev, [view.key]: { state: "generating" } }));
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            view: view.key,
            name,
            size,
            withLogo: useAiLogo,
            aspectRatio,
            model: MODELS[model],
            photoBase64: photo.base64,
            photoMime: photo.mimeType,
            logoBase64: useAiLogo ? logo?.base64 : undefined,
            logoMime: useAiLogo ? logo?.mimeType : undefined,
            backgroundStyle,
            customInstructions,
          }),
        });
        if (res.status === 401) {
          setCards((prev) => ({ ...prev, [view.key]: { state: "error", error: "Sesión expirada, inicia sesión de nuevo." } }));
          return;
        }
        if (res.status === 402) {
          const d = await res.json().catch(() => ({} as { error?: string }));
          setCards((prev) => ({ ...prev, [view.key]: { state: "error", error: d.error || "Sin créditos suficientes." } }));
          setGlobalError("Sin créditos suficientes. Recarga tu plan.");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as { error?: string }));
          throw new Error(data.error || "Error generando la imagen.");
        }
        let data = (await res.json()) as { base64: string; mimeType: string };
        if (useCanvasLogo && logo) {
          const stamped = await overlayLogoOnImage(data.base64, data.mimeType, logo.base64, logo.mimeType, logoPosition);
          data = stamped;
        }
        setCards((prev) => ({ ...prev, [view.key]: { state: "done", base64: data.base64, mimeType: data.mimeType } }));
        setDoneCount((n) => n + 1);
      } catch (err) {
        setCards((prev) => ({ ...prev, [view.key]: { state: "error", error: err instanceof Error ? err.message : "Error generando la imagen." } }));
      }
    },
    [photo, logo, logoEnabled, logoMode, logoPosition, name, size, aspectRatio, model, backgroundStyle, customInstructions, user],
  );

  const runPool = useCallback(async (items: ViewInfo[], limit: number, worker: (item: ViewInfo) => Promise<void>) => {
    let i = 0;
    const next = async () => {
      while (i < items.length) {
        const item = items[i++];
        await worker(item);
      }
    };
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
    await Promise.all(workers);
  }, []);

  const generateAll = async () => {
    setGlobalError(null);
    const active = VIEWS.filter((v) => selectedViews[v.key]);
    if (active.length === 0) {
      setGlobalError("Seleccioná al menos una vista.");
      return;
    }
    if (!photo) {
      setGlobalError("Subí la foto de la figura.");
      return;
    }
    if (!name.trim()) {
      setGlobalError("Escribí el nombre del personaje.");
      return;
    }
    if (!size.trim()) {
      setGlobalError("Escribí el tamaño de la figura.");
      return;
    }
    setIsGenerating(true);
    setDoneCount(0);
    setCards(() => Object.fromEntries(VIEWS.map((v) => [v.key, { state: "idle" }])) as Record<ViewKey, CardState>);
    try {
      await runPool(active, 3, generateView);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isGenerating && doneCount > 0) {
      const doneCards: Record<string, { base64: string; mimeType: string }> = {};
      for (const view of VIEWS) {
        const card = cards[view.key];
        if (card.state === "done") doneCards[view.key] = { base64: card.base64, mimeType: card.mimeType };
      }
      if (Object.keys(doneCards).length > 0) {
        saveGeneration({ name, size, model, aspectRatio, backgroundStyle, cards: doneCards }).catch(() => {});
      }
    }
  }, [isGenerating, doneCount, cards, name, size, model, aspectRatio, backgroundStyle]);

  const restoreFromHistory = (item: SavedGeneration) => {
    setName(item.name || "");
    setSize(item.size || "");
    if (item.model) setModel(item.model as ModelKey);
    if (item.aspectRatio) setAspectRatio(item.aspectRatio as AspectRatio);
    if (item.backgroundStyle) setBackgroundStyle(item.backgroundStyle as BackgroundStyleKey);
    const newCards: Record<ViewKey, CardState> = Object.fromEntries(VIEWS.map((v) => [v.key, { state: "idle" }])) as Record<ViewKey, CardState>;
    for (const key of Object.keys(item.cards)) {
      const vk = key as ViewKey;
      if (item.cards[vk]) newCards[vk] = { state: "done", base64: item.cards[vk].base64, mimeType: item.cards[vk].mimeType };
    }
    setCards(newCards);
  };

  const downloadCard = (view: ViewInfo, card: Extract<CardState, { state: "done" }>) => {
    const ext = card.mimeType === "image/png" ? "png" : "jpg";
    triggerDownload(dataUrlFromResult(card.base64, card.mimeType), `${sanitizeFilename(name)}_${view.filename}.${ext}`);
  };

  const downloadZip = async () => {
    const done = VIEWS.filter((v) => cards[v.key].state === "done") as ViewInfo[];
    if (done.length === 0) return;
    const zip = new JSZip();
    for (const view of done) {
      const card = cards[view.key] as Extract<CardState, { state: "done" }>;
      const ext = card.mimeType === "image/png" ? "png" : "jpg";
      zip.file(`${sanitizeFilename(name)}_${view.filename}.${ext}`, card.base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(name)}_marketplace.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </main>
    );
  }
  if (!user) return <LoginGate />;

  const activeCount = VIEWS.filter((v) => selectedViews[v.key]).length;
  const unitCost = MODEL_OPTIONS.find((m) => m.value === model)?.costPerImage ?? 0.067;
  const estimate = activeCount * unitCost;
  const hasResults = VIEWS.some((v) => cards[v.key].state === "done");

  return (
    <main className="min-h-screen bg-[#07090f] text-zinc-100 pb-28">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] rounded-full bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono-tech text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">SLICER STUDIO 3D</span>
                <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono-tech text-emerald-400">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>215°C / 60°C READY</span>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Generador de Imágenes para Marketplace</h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <CreditsBadge />
            <div className="hidden md:flex items-center gap-2 font-mono-tech text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-zinc-300">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>Layer: 0.12mm Fine</span>
            </div>
            <span className="hidden sm:block text-xs text-zinc-400 max-w-[150px] truncate">{user.email}</span>
            <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 border border-white/10 transition hover:bg-white/10 hover:border-white/20 cursor-pointer">
              <History className="h-4 w-4 text-indigo-400" />
              <span>Historial</span>
            </button>
            <button onClick={() => doLogout()} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-400 border border-white/5 transition hover:text-white hover:bg-white/5 cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {globalError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-red-400" />
            <span>{globalError}</span>
          </div>
        )}

        <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 font-mono-tech">
              <Store className="h-4 w-4 text-indigo-400" />
              <span>Presets Marketplace:</span>
            </div>
            {MARKETPLACE_PRESETS.map((p) => (
              <button key={p.name} onClick={() => setAspectRatio(p.aspectRatio)} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer border ${aspectRatio === p.aspectRatio ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 border-indigo-400/50" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10"}`}>
                <CheckCircle2 className={`h-3.5 w-3.5 ${aspectRatio === p.aspectRatio ? "text-white" : "text-zinc-500"}`} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <button onClick={copyPromptsForGeminiChat} className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer" title="Copiar las instrucciones formateadas para pegarlas gratis en gemini.google.com">
            {copiedPrompts ? (
              <>
                <CopyCheck className="h-4 w-4 text-emerald-300" />
                <span>¡Prompts Copiados!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-emerald-400" />
                <span>Copiar Prompts (Gemini Web Gratis 🎁)</span>
              </>
            )}
          </button>
        </section>

        <section className="mb-8 rounded-3xl glass-panel p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[10px] font-mono-tech text-indigo-400/40">X: 0mm Y: 250mm</div>
          <div className="absolute top-2 right-3 text-[10px] font-mono-tech text-indigo-400/40">X: 250mm Y: 250mm</div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                  1. Captura de la Figura 3D
                </span>
                <span className="text-[10px] font-mono-tech text-zinc-500">BUILD PLATE PEI</span>
              </div>
              <UploadZone subtitle="Formatos JPG, PNG o WEBP (máx. 1536px)" image={photo} onChange={onPhotoChange} isLogo={false} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Nombre del personaje / modelo 3D</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Goku Super Saiyan 4" className="w-full rounded-xl border border-white/10 bg-[#07090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Calibrador Digital de Tamaño</span>
                  </span>
                  <span className="text-[10px] font-mono-tech text-emerald-400">DIGITAL GAUGE</span>
                </label>
                <div className="lcd-caliper-screen flex items-center justify-between rounded-xl p-3">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider opacity-70">MEDIDA REGISTRADA</span>
                    <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="27 cm" className="bg-transparent text-lg font-bold outline-none w-full text-emerald-300" />
                  </div>
                  <div className="text-right border-l border-emerald-500/30 pl-3">
                    <span className="text-xs font-bold block text-emerald-400">± 0.05</span>
                    <span className="text-[9px] opacity-70 block">PRECISIÓN</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <Flame className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Muestra de Filamento / Fondo de Estudio</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BACKGROUND_STYLES.map((bg) => (
                    <button key={bg.value} type="button" onClick={() => setBackgroundStyle(bg.value)} className={`rounded-xl p-2.5 text-left transition cursor-pointer border ${backgroundStyle === bg.value ? "bg-indigo-600/30 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold">{bg.label}</p>
                        <span className={`h-2 w-2 rounded-full ${backgroundStyle === bg.value ? "bg-indigo-400" : "bg-zinc-600"}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-300">Modelo IA</label>
                  <select value={model} onChange={(e) => setModel(e.target.value as ModelKey)} className="w-full rounded-xl border border-white/10 bg-[#07090f] px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer font-mono-tech">
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-zinc-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-300">Formato (Ratio)</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full rounded-xl border border-white/10 bg-[#07090f] px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer font-mono-tech">
                    {ASPECT_RATIOS.map((r) => (
                      <option key={r} value={r} className="bg-zinc-900 text-white">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {logo && (
                <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                      <Crosshair className="h-3.5 w-3.5" />
                      <span>Estampa de Logo Canvas:</span>
                    </span>
                    <select value={logoMode} onChange={(e) => setLogoMode(e.target.value as "canvas" | "ai")} className="rounded-lg bg-indigo-900/50 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer font-mono-tech">
                      <option value="canvas">Canvas Nítido ⭐</option>
                      <option value="ai">IA Gemini</option>
                    </select>
                  </div>
                  {logoMode === "canvas" && (
                    <div>
                      <span className="block text-[10px] text-zinc-400 mb-1.5">Selecciona la esquina de colocación:</span>
                      <div className="grid grid-cols-2 gap-1.5 max-w-[170px]">
                        {LOGO_POSITIONS.map((pos) => (
                          <button key={pos.value} type="button" onClick={() => setLogoPosition(pos.value)} className={`rounded-lg p-1.5 text-[10px] font-bold transition border cursor-pointer ${logoPosition === pos.value ? "bg-indigo-600 border-indigo-400 text-white shadow-xs" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"}`}>
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                  <Wand2 className="h-3 w-3 text-indigo-400" />
                  <span>Instrucciones adicionales para la IA</span>
                </label>
                <input type="text" value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Ej: luz cálida de estudio, resaltar detalles esculpidos" className="w-full rounded-xl border border-white/10 bg-[#07090f] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">2. Logo de la marca (opcional)</span>
                <span className="text-[10px] font-mono-tech text-zinc-500">TRANSPARENT PNG</span>
              </div>
              <UploadZone subtitle="PNG transparente recomendado (máx. 512px)" image={logo} onChange={onLogoChange} isLogo={true} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VIEWS.map((view) => {
            const card = cards[view.key];
            const selected = selectedViews[view.key];
            return (
              <div key={view.key} className={`flex flex-col rounded-3xl p-4 transition-all ${selected ? "glass-card-active" : "glass-card opacity-50"}`}>
                <div className="mb-3 flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-white">
                    <input type="checkbox" checked={selected} onChange={() => toggleView(view.key)} className="h-4 w-4 accent-indigo-600 rounded cursor-pointer" />
                    {view.label}
                  </label>
                  {view.withLogo && (
                    <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-zinc-400">
                      <input type="checkbox" checked={logoEnabled[view.key] && !!logo} onChange={() => toggleLogoOnView(view.key)} disabled={!logo} className="h-3 w-3 accent-indigo-600 cursor-pointer disabled:opacity-40" />
                      Logo
                    </label>
                  )}
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-zinc-400">{view.description}</p>
                <div className="mt-auto">
                  <ResultSlot view={view} card={card} onDownload={downloadCard} onRegenerate={generateView} onOpenLightbox={(cardState) => setActiveLightbox({ viewInfo: view, cardState })} />
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <div className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-4xl">
        <div className="glass-panel flex items-center justify-between rounded-2xl px-6 py-3.5 shadow-2xl border border-indigo-500/25 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-mono-tech font-bold">{activeCount}</div>
            <div>
              <p className="text-xs font-bold text-white">{activeCount} vista{activeCount === 1 ? "" : "s"} seleccionada{activeCount === 1 ? "" : "s"}</p>
              <p className="text-[11px] font-mono-tech text-zinc-400">Costo estimado: <span className="font-bold text-emerald-400">~US${estimate.toFixed(2)}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={downloadZip} disabled={!hasResults || isGenerating} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 border border-white/10 cursor-pointer">
              <Package className="h-4 w-4 text-indigo-300" />
              <span>Descargar ZIP</span>
            </button>
            <button onClick={generateAll} disabled={isGenerating} className="btn-glow-indigo flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              {isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Generando {doneCount}/{activeCount}…
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Renderizar Catálogo 3D</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeLightbox && (
        <ImageLightboxModal isOpen={!!activeLightbox} onClose={() => setActiveLightbox(null)} title={activeLightbox.viewInfo.label} filename={activeLightbox.viewInfo.filename} characterName={name} base64={activeLightbox.cardState.base64} mimeType={activeLightbox.cardState.mimeType} originalPhotoBase64={photo?.base64} originalPhotoMime={photo?.mimeType} />
      )}
      <HistoryDrawer isOpen={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={restoreFromHistory} />
    </main>
  );
}
