"use client";
/* eslint-disable @next/next/no-img-element */

import { dataUrlFromResult } from "@/lib/client/image";
import type { ViewInfo } from "@/lib/constants";
import { Image as ImageIcon, ZoomIn, Download, RefreshCw } from "lucide-react";

export type CardState =
  | { state: "idle" }
  | { state: "generating" }
  | { state: "done"; base64: string; mimeType: string }
  | { state: "error"; error: string };

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function ResultSlot({
  view,
  card,
  onDownload,
  onRegenerate,
  onOpenLightbox,
}: {
  view: ViewInfo;
  card: CardState;
  onDownload: (view: ViewInfo, card: Extract<CardState, { state: "done" }>) => void;
  onRegenerate: (view: ViewInfo) => void;
  onOpenLightbox: (cardState: Extract<CardState, { state: "done" }>) => void;
}) {
  if (card.state === "generating") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl bg-[#070911] border border-indigo-500/30">
        <Spinner />
        <p className="text-xs font-bold text-indigo-400 animate-pulse font-mono-tech">SLICING RENDER…</p>
      </div>
    );
  }
  if (card.state === "done") {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#070911]">
        <img src={dataUrlFromResult(card.base64, card.mimeType)} alt={view.label} onClick={() => onOpenLightbox(card)} className="aspect-square w-full object-cover cursor-zoom-in transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 transition group-hover:opacity-100">
          <button onClick={() => onOpenLightbox(card)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/20 px-2 py-1.5 text-[10px] font-bold text-white backdrop-blur transition hover:bg-white/30 cursor-pointer">
            <ZoomIn className="h-3 w-3" />
            <span>Ver HD</span>
          </button>
          <button onClick={() => onDownload(view, card)} className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur transition hover:bg-white/30 cursor-pointer" title="Descargar">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onRegenerate(view)} className="rounded-lg bg-indigo-600/90 p-1.5 text-white backdrop-blur transition hover:bg-indigo-600 cursor-pointer" title="Regenerar">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
  if (card.state === "error") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-red-950/30 border border-red-500/30 p-3 text-center">
        <p className="text-xs font-bold text-red-400">Error en la generación</p>
        <p className="line-clamp-3 text-[10px] text-red-300/80">{card.error}</p>
        <button onClick={() => onRegenerate(view)} className="mt-1 flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-red-500 cursor-pointer">
          <RefreshCw className="h-3 w-3" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#070911]/80 border border-white/5 text-center p-3">
      <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 border border-white/5 mb-0.5">
        <ImageIcon className="h-4 w-4" />
      </div>
      <p className="text-xs font-bold text-zinc-400">Vista Pendiente</p>
      <p className="text-[10px] text-zinc-500 font-mono-tech">[ Render 0.12mm ]</p>
    </div>
  );
}

export { Spinner };
