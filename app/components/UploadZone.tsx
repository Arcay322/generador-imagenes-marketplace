"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { UploadCloud, Trash2, RotateCcw } from "lucide-react";
import { dataUrlFromResult, type CompressedImage } from "@/lib/client/image";

export function UploadZone({
  subtitle,
  image,
  onChange,
  isLogo,
}: {
  subtitle: string;
  image: CompressedImage | null;
  onChange: (file: File | undefined | null) => void;
  isLogo: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="flex flex-col gap-2"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onChange(e.dataTransfer.files?.[0]);
      }}
    >
      {image ? (
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${isLogo ? "checkerboard-bg" : "build-plate-grid"}`}>
          <img src={dataUrlFromResult(image.base64, image.mimeType)} alt="upload" className="aspect-square w-full object-contain p-2" />
          <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <button onClick={() => onChange(undefined)} className="flex items-center gap-1 rounded-lg bg-red-600/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur transition hover:bg-red-600 cursor-pointer">
              <Trash2 className="h-3 w-3" />
              <span>Quitar</span>
            </button>
            <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur transition hover:bg-white/30 cursor-pointer">
              <RotateCcw className="h-3 w-3" />
              <span>Reemplazar</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition cursor-pointer ${isLogo ? "checkerboard-bg" : "build-plate-grid"} ${dragging ? "border-indigo-500 bg-indigo-500/10" : "border-white/15 hover:border-indigo-500/50 hover:bg-indigo-500/5"}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-indigo-400">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-zinc-200">Arrastra o haz clic</span>
            <span className="text-[10px] text-zinc-400">{subtitle}</span>
          </div>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
    </div>
  );
}
