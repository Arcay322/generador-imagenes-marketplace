"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { dataUrlFromResult, triggerDownload, sanitizeFilename } from "@/lib/client/image";
import { ZoomIn, Eye, Download, X, Layers, Image as ImageIcon } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  characterName: string;
  base64: string;
  mimeType: string;
  originalPhotoBase64?: string;
  originalPhotoMime?: string;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  title,
  filename,
  characterName,
  base64,
  mimeType,
  originalPhotoBase64,
  originalPhotoMime,
}: ImageLightboxModalProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (!isOpen) return null;

  const currentBase64 = showOriginal && originalPhotoBase64 ? originalPhotoBase64 : base64;
  const currentMime = showOriginal && originalPhotoMime ? originalPhotoMime : mimeType;
  const dataUrl = dataUrlFromResult(currentBase64, currentMime);

  const handleDownload = () => {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    triggerDownload(
      dataUrlFromResult(base64, mimeType),
      `${sanitizeFilename(characterName)}_${filename}.${ext}`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#0d1322] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#090d16]/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-zinc-400">
                {characterName ? `Personaje: ${characterName}` : "Vista previa generada"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {originalPhotoBase64 && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer border ${
                  showOriginal
                    ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/30"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>{showOriginal ? "Foto Original" : "Mantener para comparar original"}</span>
              </button>
            )}

            <button
              onClick={() => setZoom(!zoom)}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
              <span>{zoom ? "Restablecer Zoom" : "Zoom HD"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar</span>
            </button>

            <button
              onClick={onClose}
              className="ml-2 rounded-xl p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#070911] p-6">
          <img
            src={dataUrl}
            alt={title}
            className={`max-h-[72vh] w-auto rounded-2xl object-contain shadow-2xl transition-transform duration-300 ${
              zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={() => setZoom(!zoom)}
          />
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#090d16]/90 px-6 py-3.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>{showOriginal ? "Mostrando captura original subida" : "Render de alta definición con Gemini AI Studio"}</span>
          </div>
          <span>Haz clic sobre la imagen para ampliar zoom</span>
        </div>
      </div>
    </div>
  );
}
