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
  muse: "openrouter/meta/muse-image",
  krea: "openrouter/krea/krea-2-medium-turbo",
  gpt5mini: "openrouter/openai/gpt-5-image-mini",
  gpt5: "openrouter/openai/gpt-5-image",
  gpt54: "openrouter/openai/gpt-5.4-image-2",
  gemini25: "openrouter/google/gemini-2.5-flash-image",
  gemini31lite: "openrouter/google/gemini-3.1-flash-lite-image",
  gemini31: "openrouter/google/gemini-3.1-flash-image",
  gemini3pro: "openrouter/google/gemini-3-pro-image",
  lite: "gemini-3.1-flash-lite-image",
  flash: "gemini-3.1-flash-image",
  pro: "gemini-3-pro-image",
} as const;

export type ModelKey = keyof typeof MODELS;

export const MODEL_OPTIONS: { value: ModelKey; label: string; description: string; costPerImage: number }[] = [
  {
    value: "free",
    label: "GRATIS 🎁 Pollinations / Flux",
    description: "100% Gratis ($0.00). Baja fidelidad, solo para probar.",
    costPerImage: 0.0,
  },
  {
    value: "muse",
    label: "Meta Muse Image $0.01",
    description: "Meta agentic, pierde fidelidad en producto.",
    costPerImage: 0.01,
  },
  {
    value: "krea",
    label: "Krea 2 Medium Turbo $0.015",
    description: "Krea rápido, diseño gráfico, 1 ref imagen.",
    costPerImage: 0.015,
  },
  {
    value: "gpt5mini",
    label: "GPT-5 Image Mini $0.008",
    description: "OpenAI mini, alta fidelidad barata. Recomendado test.",
    costPerImage: 0.008,
  },
  {
    value: "gpt54",
    label: "GPT-5.4 Image 2 $0.03",
    description: "OpenAI, variante 5.4 para comparar con mini.",
    costPerImage: 0.03,
  },
  {
    value: "gpt5",
    label: "GPT-5 Image $0.04",
    description: "OpenAI flagship image, más caro.",
    costPerImage: 0.04,
  },
  {
    value: "gemini25",
    label: "Nano Banana 1 $0.03 (OR)",
    description: "Gemini 2.5 Flash Image vía OpenRouter ($0.03).",
    costPerImage: 0.03,
  },
  {
    value: "gemini31lite",
    label: "Nano 2 Lite $0.03 (OR)",
    description: "Gemini 3.1 Flash Lite vía OR, vs directo $0.034.",
    costPerImage: 0.03,
  },
  {
    value: "gemini31",
    label: "Nano 2 Flash $0.06 (OR)",
    description: "Gemini 3.1 Flash vía OR, vs directo $0.067.",
    costPerImage: 0.06,
  },
  {
    value: "gemini3pro",
    label: "Nano Pro $0.12 (OR)",
    description: "Gemini 3 Pro vía OR, vs directo $0.30.",
    costPerImage: 0.12,
  },
  {
    value: "lite",
    label: "Nano 2 Lite $0.034 (Directo)",
    description: "Google directo, ultra-económico.",
    costPerImage: 0.034,
  },
  {
    value: "flash",
    label: "Nano 2 Flash $0.067 (Directo)",
    description: "Google directo, equilibrio calidad/precio.",
    costPerImage: 0.067,
  },
  {
    value: "pro",
    label: "Nano Pro $0.30 (Directo)",
    description: "Google directo, máxima calidad.",
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

