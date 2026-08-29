import type { ViewKey, BackgroundStyleKey } from "./constants";

export interface BuildPromptParams {
  view: ViewKey;
  name: string;
  size: string;
  withLogo: boolean;
  backgroundStyle?: BackgroundStyleKey;
  customInstructions?: string;
}

const LOGO_TEXT =
  "Integra de forma discreta y nítida el logo de la marca (la segunda imagen de referencia) en la esquina inferior derecha de la imagen final. El logo debe quedar pequeño, limpio, legible y con buen contraste, sin tapar la figura.";

const BACKGROUND_DESCRIPTIONS: Record<BackgroundStyleKey, string> = {
  estudio: "Fondo neutro de estudio profesional con un degradado suave de blanco a gris claro y sombras suaves.",
  madera: "Superficie de madera clara pulida estilo escandinavo con iluminación cálida de estudio.",
  gamer: "Ambiente oscuro con sutiles luces de acento azul y violeta neón desenfocadas en el fondo.",
  industrial: "Superficie de trabajo limpia de taller creativo maker / impresión 3D con desenfoque de profundidad.",
};

function base(name: string): string {
  return `Esta es una foto real de una figura coleccionable de ${name} impresa en 3D. Mantén EXACTAMENTE la misma figura: su diseño, colores, proporciones y detalles, sin cambiar nada del personaje. Solo cambia la presentación.`;
}

function sizeHint(size: string): string {
  return size.trim() ? ` La figura mide ${size.trim()} de alto.` : "";
}

const PROMPTS: Record<ViewKey, (name: string, size: string) => string> = {
  principal: (name, size) =>
    `${base(name)}${sizeHint(size)} Genera una imagen profesional de PORTADA para un marketplace. Muestra la figura completa, vista frontal, levemente desde la altura del pecho. Sin objetos ni distracciones. Iluminación de estudio pareja con sombras suaves que resalten el volumen y los detalles esculpidos. Alta calidad, nítida, estilo foto de catálogo. Sin texto, sin marcas de agua.`,

  detalle: (name, size) =>
    `${base(name)}${sizeHint(size)} Genera un PRIMER PLANO (close-up) del rostro, el cabello y los detalles del acabado, para mostrar la calidad del ensamble multicolor, la nitidez de las líneas y la textura sin marcas ni imperfecciones de pintura. Fondo difuminado (bokeh), luz suave de estudio, profundidad de campo corta. Alta calidad, nítida. Sin texto, sin marcas de agua.`,

  escala: (name, size) =>
    `${base(name)}${sizeHint(size)} Genera una foto de producto que muestre la figura completa de pie junto a una REGLA o cinta métrica vertical como referencia de escala. Dibuja una línea de medición con sus flechas y la etiqueta del tamaño "${size.trim() || "27 cm"}" de forma claramente legible, indicando con precisión la altura total de la figura (desde la base hasta el punto más alto). La regla, sus marcas y los números deben verse nítidos, rectos y contrastados. El comprador debe apreciar visualmente los ${size.trim() || "27 cm"} reales de la figura. Mantén la misma figura tal cual, sin modificarla. Iluminación pareja con sombras suaves. Alta calidad, sin marcas de agua.`,

  grid: (name, size) =>
    `${base(name)}${sizeHint(size)} Crea una imagen compuesta (GRID/COLLAGE) profesional de marketplace: una toma principal grande de la figura de frente + 3 paneles más pequeños con detalle del rostro, vista lateral y vista trasera. Mantén la misma figura exacta en todas las tomas. Iluminación de estudio pareja, composición limpia con márgenes parejos. Sin texto, sin marcas de agua.`,
};

export function buildPrompt({
  view,
  name,
  size,
  withLogo,
  backgroundStyle = "estudio",
  customInstructions = "",
}: BuildPromptParams): string {
  let prompt = PROMPTS[view](name.trim(), size.trim());
  const bgDesc = BACKGROUND_DESCRIPTIONS[backgroundStyle] ?? BACKGROUND_DESCRIPTIONS.estudio;
  prompt += ` ${bgDesc}`;

  if (customInstructions?.trim()) {
    prompt += ` Nota adicional: ${customInstructions.trim()}`;
  }

  return withLogo ? `${prompt} ${LOGO_TEXT}` : prompt;
}

