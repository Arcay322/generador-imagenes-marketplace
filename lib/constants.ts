export type ViewKey = "principal" | "detalle" | "escala" | "grid";

export interface ViewInfo {
  key: ViewKey;
  label: string;
  description: string;
  filename: string;
  withLogo: boolean;
}

export const VIEWS: ViewInfo[] = [
  {
    key: "principal",
    label: "01 · Principal (portada)",
    description:
      "Vista frontal completa de la figura, fondo neutro y luz que resalte el volumen.",
    filename: "01_principal",
    withLogo: true,
  },
  {
    key: "detalle",
    label: "02 · Detalle del acabado",
    description:
      "Close-up del rostro y la textura para mostrar la calidad del ensamble.",
    filename: "02_detalle",
    withLogo: false,
  },
  {
    key: "escala",
    label: "03 · Escala / medidas",
    description:
      "Figura junto a una regla con línea de medición que indica los centímetros reales.",
    filename: "03_escala",
    withLogo: true,
  },
  {
    key: "grid",
    label: "04 · Grid / set completo",
    description:
      "Collage marketplace con la figura desde varios ángulos en una imagen.",
    filename: "04_grid",
    withLogo: true,
  },
];

export const MODELS = {
  free: "pollinations-flux-free",
  lite: "gemini-3.1-flash-lite-image",
  flash: "gemini-3.1-flash-image",
  pro: "gemini-3-pro-image",
} as const;

export type ModelKey = keyof typeof MODELS;

export const MODEL_OPTIONS: { value: ModelKey; label: string; description: string; costPerImage: number }[] = [
  {
    value: "free",
    label: "Modo GRATIS 🎁 (Pollinations / Flux)",
    description: "100% Gratuito (US$0.00). Generación ilimitada sin costo de API.",
    costPerImage: 0.0,
  },
  {
    value: "lite",
    label: "Nano Banana 2 Lite",
    description: "Ultra-económico (~US$0.03/imagen).",
    costPerImage: 0.034,
  },
  {
    value: "flash",
    label: "Nano Banana 2 (Flash)",
    description: "Equilibrio calidad/precio (~US$0.07/imagen). Ideal con logo + foto.",
    costPerImage: 0.067,
  },
  {
    value: "pro",
    label: "Nano Banana Pro",
    description: "Máxima calidad, más lento (~US$0.30/imagen).",
    costPerImage: 0.3,
  },
];


export const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const VIEW_KEYS: ViewKey[] = ["principal", "detalle", "escala", "grid"];

export const BACKGROUND_STYLES = [
  { value: "estudio", label: "Estudio Blanco Clean", description: "Fondo neutro degradado suave de estudio profesional." },
  { value: "madera", label: "Madera Minimalista", description: "Superficie de madera clara con iluminación cálida." },
  { value: "gamer", label: "Neón / Gamer", description: "Ambiente oscuro con luces neón y contraste alto." },
  { value: "industrial", label: "Taller Maker / Industrial", description: "Fondo estilo taller de impresión 3D o mesa de trabajo." },
] as const;

export type BackgroundStyleKey = (typeof BACKGROUND_STYLES)[number]["value"];

export const MARKETPLACE_PRESETS = [
  { name: "Mercado Libre (1:1)", aspectRatio: "1:1" as AspectRatio, note: "Recomendado 1:1 blanco puro" },
  { name: "Instagram Post (4:5)", aspectRatio: "3:4" as AspectRatio, note: "Formato vertical para feed" },
  { name: "Etsy (4:3)", aspectRatio: "4:3" as AspectRatio, note: "Formato horizontal de catálogo" },
  { name: "Amazon (1:1)", aspectRatio: "1:1" as AspectRatio, note: "Fondo limpio de estudio" },
] as const;

export const LOGO_POSITIONS = [
  { value: "bottom-right", label: "Abajo Derecha" },
  { value: "bottom-left", label: "Abajo Izquierda" },
  { value: "top-right", label: "Arriba Derecha" },
  { value: "top-left", label: "Arriba Izquierda" },
] as const;

export type LogoPosition = (typeof LOGO_POSITIONS)[number]["value"];

