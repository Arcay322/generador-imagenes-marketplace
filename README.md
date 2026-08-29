# Generador de imágenes para marketplace

Subí una foto de tu figura impresa en 3D + nombre + tamaño, y la IA (Gemini / Nano Banana) genera automáticamente las imágenes de venta: portada, detalle, escala y grid, con tu logo.

## ⚠️ Requisito importante: billing en Gemini

Desde 2026, **los modelos de generación de imágenes de Gemini NO tienen plan gratuito** (los modelos de texto sí). Tu API key de Google AI Studio en el plan Free devuelve `429 Quota exceeded ... free_tier_requests, limit: 0` para los modelos de imagen.

Para que funcione tenés que:

1. Entrar a [Google AI Studio → Billing](https://aistudio.google.com/apikey) con la cuenta de tu API key.
2. **Set up billing**: vinculá una cuenta de Cloud Billing y cargá crédito (mínimo US$10 prepago).
3. Usar la **misma API key** (la de un proyecto con billing activo). Verificá que funcione probando una generación en [AI Studio](https://aistudio.google.com/).

Costos aproximados (pagas solo lo que usás):

| Modelo | Costo por imagen (~1K) |
|---|---|
| `gemini-3.1-flash-lite-image` (Lite) | ~US$0.03 |
| `gemini-3.1-flash-image` (Flash) | ~US$0.07 |
| `gemini-3-pro-image` (Pro) | ~US$0.30 |

> 💡 Mientras no actives billing, podés probar la UI con `MOCK_GENERATE=1 npm run dev` (devuelve imágenes placeholder sin llamar a Gemini).

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # completá GEMINI_API_KEY y APP_PASSWORD
npm run dev
```

Abrí http://localhost:3000 e ingresá la contraseña de `APP_PASSWORD`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | API key de Google AI Studio (de un proyecto con billing para generar imágenes). |
| `APP_PASSWORD` | Contraseña que protege la web (se envía en cada request y se valida en el servidor). |

## Cómo se usa

1. Subí la **foto de la figura** (se comprime automáticamente en el navegador).
2. Escribí el **nombre del personaje** y el **tamaño** (ej. "27 cm").
3. Subí tu **logo** (opcional, PNG con transparencia ideal).
4. Elegí el **modelo** (Lite / Flash / Pro), el **formato** (1:1, 3:4, etc.) y las **vistas** que querés.
5. **Generar imágenes**: las 4 vistas se procesan en paralelo (máx. 3 a la vez) y aparecen apenas terminan, con descarga individual.
6. **Descargar todo (ZIP)**: arma un ZIP con `{nombre}_{vista}.png` en el navegador.

## Vistas generadas

| Vista | Descripción | Logo |
|---|---|---|
| 01 · Principal | Portada: figura completa de frente, fondo neutro, luz de estudio | Sí* |
| 02 · Detalle | Close-up del rostro/acabado | No |
| 03 · Escala | Figura al lado de una lata de 33 cl como referencia | Sí* |
| 04 · Grid | Collage marketplace con varias tomas | Sí* |

\* El logo se puede activar/desactivar por tarjeta.

## Despliegue en Vercel

1. Subí el proyecto a GitHub (o usá la CLI de Vercel).
2. Importá el repo en [vercel.new](https://vercel.new).
3. En **Settings → Environment Variables**, agregá:
   - `GEMINI_API_KEY`
   - `APP_PASSWORD`
4. Deploy. La web queda pública pero protegida por la contraseña.

La API de generación usa `export const maxDuration = 300` (dentro del límite de Vercel Hobby).

## Estructura

```
app/
  page.tsx                 # UI (password gate, upload, campos, tarjetas, ZIP)
  api/generate/route.ts    # POST: valida password, llama a Gemini, devuelve 1 imagen
  api/check/route.ts       # GET: valida la contraseña
lib/
  constants.ts             # vistas, modelos, formatos
  prompts.ts               # templates de prompts de cada vista
  gemini.ts                # cliente GoogleGenAI
  client/image.ts          # compresión en el navegador + descargas
```

## Notas

- Las imágenes generadas llevan marca de agua invisible (SynthID) de Google.
- La escala de centímetros es una referencia visual, no una medición exacta.
- Los límites de request de Vercel (4.5 MB) se resuelven comprimiendo la foto en el navegador antes de subirla.
