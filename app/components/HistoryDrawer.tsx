"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { getGenerations, deleteGeneration, type SavedGeneration } from "@/lib/client/storage";
import { VIEWS } from "@/lib/constants";
import { dataUrlFromResult, sanitizeFilename } from "@/lib/client/image";
import { History, Package, Trash2, X, Clock, Layers } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: SavedGeneration) => void;
}

export function HistoryDrawer({ isOpen, onClose, onRestore }: HistoryDrawerProps) {
  const [history, setHistory] = useState<SavedGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const list = await getGenerations();
      if (!cancelled) {
        setHistory(list);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const reload = async () => {
    setLoading(true);
    const list = await getGenerations();
    setHistory(list);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteGeneration(id);
    await reload();
  };

  const handleDownloadZip = async (item: SavedGeneration, e: React.MouseEvent) => {
    e.stopPropagation();
    const zip = new JSZip();
    for (const view of VIEWS) {
      const card = item.cards[view.key];
      if (card?.base64) {
        const ext = card.mimeType === "image/png" ? "png" : "jpg";
        zip.file(`${sanitizeFilename(item.name)}_${view.filename}.${ext}`, card.base64, {
          base64: true,
        });
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(item.name)}_marketplace.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-md flex-col bg-[#0b0f19] border-l border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#080b13]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Historial de Trabajos</h3>
              <p className="text-xs text-zinc-400">Generaciones guardadas en este navegador</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Cargando historial local…</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              <Layers className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              No hay imágenes guardadas aún. Las próximas generaciones aparecerán aquí automáticamente.
            </div>
          ) : (
            history.map((item) => {
              const cardKeys = Object.keys(item.cards);
              const firstCardKey = cardKeys[0];
              const firstCard = firstCardKey ? item.cards[firstCardKey] : null;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onRestore(item);
                    onClose();
                  }}
                  className="group relative flex cursor-pointer gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 transition hover:border-indigo-500/50 hover:bg-indigo-500/10"
                >
                  {firstCard ? (
                    <img
                      src={dataUrlFromResult(firstCard.base64, firstCard.mimeType)}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover bg-[#070911] border border-white/10"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-[#070911] border border-white/10 flex items-center justify-center text-zinc-600">
                      <Package className="h-6 w-6" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {item.name || "Figura sin nombre"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {item.size ? `${item.size} · ` : ""}
                        {cardKeys.length} vista{cardKeys.length === 1 ? "" : "s"}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => handleDownloadZip(item, e)}
                        className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/20 border border-white/10 cursor-pointer"
                      >
                        <Package className="h-3 w-3" />
                        <span>ZIP</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 text-[11px] text-zinc-400 bg-[#080b13]">
          Almacenamiento persistente en IndexedDB (últimos 10 conjuntos).
        </div>
      </div>
    </div>
  );
}
