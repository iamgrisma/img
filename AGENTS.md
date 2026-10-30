# Agent and Contributor Guide for ImagEngine

This document defines the architectural model, internal contracts, critical invariants, and development practices for AI coding agents and human contributors working on the **ImagEngine** codebase.

---

## 1. System Architecture Overview

ImagEngine is a zero-latency, WebAssembly-powered image optimization and transformation proxy designed for Cloudflare Pages (Advanced Mode) and Cloudflare Workers. It dynamically fetches images from configured upstream tenant domains, transforms them in-memory using WebAssembly (Photon for rasters, resvg for SVGs), and serves them with immutable edge caching.

### Core File Structure

- `src/constants.ts`
  - Defines tenant mappings (`TENANTS`), engine reserved query parameter keys (`ENGINE_KEYS`), MIME types, cache header policies, and memory/dimension limits (`MAX_DIMENSION = 2560`, `MAX_UPSCALE_FACTOR = 4`, `RASTER_MAX_SIZE = 25_000_000`, `SVG_MAX_SIZE = 2_000_000`, `FETCH_TIMEOUT_MS = 5_000`).
- `src/routing.ts`
  - Handles URL route parsing and upstream origin resolution.
  - Supports dual route patterns: slug-based conversion (`path-origExt.targetExt`) and query parameter-based conversion (`path.origExt?format=targetExt`).
  - Resolves and sanitizes transformation options (`w`, `h`, `fit`, `position`, `cw`, `ch`, `q`, etc.).
- `src/fonts/embedded-fonts.ts`
  - In-memory embedded TrueType typography buffers (Plus Jakarta Sans, Inter, Kalimati) decoded on isolate startup to power `@cf-wasm/resvg` text rendering without network lookups or OS system font dependencies.
- `src/processor.ts`
  - Core image transformation engine.
  - Interfaces with `@cf-wasm/photon` (raster processing) and `@cf-wasm/resvg` (SVG rendering).
  - Implements the crop-first cover resize algorithm, lossless 90/180/270 degree rotation, upscale clamping, and safe memory management (`toFree.push(old); image.free()`).
- `src/response.ts`
  - Response builder utility.
  - Computes cryptographic SHA-256 ETags and handles HTTP 304 Not Modified negotiation.
  - Sets 1-year immutable caching for successful image transforms (`Cache-Control`, `CDN-Cache-Control`, `Cloudflare-CDN-Cache-Control`).
  - Implements 300-second negative caching for HTTP 404 responses to shield upstream origins from DDoS and quota exhaustion.
- `src/index.ts`
  - Main Hono application routing, CORS negotiation, and Cloudflare `caches.default` programmatic edge cache matching.
- `src/functions/[[path]].ts`
  - Entrypoint for compiling Cloudflare Pages Functions into `public/_worker.js`.
- `scripts/build.js`
  - Build script that runs `tsc --noEmit`, invokes `wrangler pages functions build src/functions --outdir public`, and produces `public/_worker.js`.
- `public/_routes.json`
  - Cloudflare Pages routing configuration. Explicitly includes dynamic tenant paths and excludes static files (`/`, `/index.html`, `/try-yourself.html`, etc.) so static requests never invoke the Worker.
- `public/index.html` & `public/try-yourself.html`
  - Client-facing dashboard, parameter visualizer, and interactive sandbox.

---

## 2. Invariants and Architectural Rules

All agents and contributors must strictly adhere to the following rules:

### Invariant 1: Cloudflare Pages Advanced Mode (Zero-Config Deployment)
- Never create a root `/functions` folder.
- If a root `/functions` directory exists, Cloudflare Pages CI attempts to build Functions using its legacy build environment where `node_modules` are not installed, causing deployment failures (`Could not resolve "hono"`, etc.).
- Instead, the build output is pre-compiled into `public/_worker.js` and `.wasm` files committed directly in `public/`.
- This enables zero-config deployment: the build command in the Cloudflare Pages dashboard remains completely empty, and the output directory is `public`.

### Invariant 2: Lossless WASM Rotation
- Never call Photon's WASM `rotate()` function directly.
- Photon's WASM implementation shifts 8-bit color channels by bitwise powers of 2, resulting in color washout and palette distortion.
- Always use `rotateLossless()` in `src/processor.ts`, which performs direct pixel byte permutations on raw RGBA Uint8Array buffers for 90, 180, and 270 degree rotations.

### Invariant 3: Crop-First Resizing for `fit=cover`
- When resizing with `fit=cover`, never scale the source image to target dimensions before cropping.
- Doing so with extreme aspect ratios (e.g. 600x351 requested as 600x4000) causes intermediate dimensions of thousands of pixels (e.g. 6838x4000 = 27.3 megapixels), consuming over 100MB of RAM and crashing the Cloudflare Worker with CPU or Out-of-Memory limits.
- Always calculate the target aspect ratio and crop the source image first, then resize the cropped slice to the target dimensions.

### Invariant 4: Upscale Clamping and Adaptive Filter
- To prevent abuse and memory exhaustion, image upscaling is strictly capped at `4x` the source image dimensions, and globally capped at `MAX_DIMENSION = 2560`.
- If an incoming request asks for dimensions exceeding 4x the original, the engine clamps to `sw * 4` (or `sh * 4`). For example, requesting 1800px on a 400px image produces a 1600px image.
- When upscaling or generating large output canvases (>2.5 megapixels), the engine adaptively switches from 36-tap `Lanczos3` to fast `Triangle` (Bilinear) interpolation to prevent exceeding Cloudflare's 50ms CPU limit.

### Invariant 5: Memory Management and Freeing
- Objects created via Photon (`PhotonImage`) allocate memory within the WebAssembly linear heap.
- Always register intermediate `PhotonImage` instances into a `toFree` array and call `.free()` inside `try / catch` blocks to avoid memory leaks across requests within the same Worker isolate.

### Invariant 6: Zero-Emoji Interface and Documentation
- ImagEngine follows a clean, minimalist, high-density professional aesthetic.
- Do not use emojis anywhere in HTML interfaces, Markdown documentation, code comments, or commit messages.

### Invariant 7: Edge Route Whitelist
- When adding new upstream tenant aliases or endpoints, always update both `TENANTS` in `src/constants.ts` and `include` in `public/_routes.json`.
- Keep static assets (`/favicon.ico`, `/logo.svg`, `/og.svg`, `/og.webp`, `/index.html`, `/try-yourself.html`) explicitly listed under `exclude` in `public/_routes.json` so they are delivered directly from the Cloudflare edge cache with 0 worker invocations.

### Invariant 8: WebAssembly Font Engine and Typography Preservation
- In WebAssembly isolates, `resvg` has zero access to OS system fonts (`loadSystemFonts: false` is mandatory).
- Calling `new Resvg()` without custom font buffers causes all `<text>` nodes in SVG assets to render completely blank or invisible.
- Always provide `fontBuffers` from `getCoreFontBuffers()` (`src/fonts/embedded-fonts.ts`) to `Resvg`. This guarantees that Latin/English text (`Plus Jakarta Sans`, `Inter`) and Devanagari/Nepali text (`Kalimati`) render accurately with 100% glyph fidelity on every edge worker across all tenants (e.g. `fontsdir` / `fonts.tn`).

---

## 3. Development and Verification Workflow

### Type Checking and Building
Before committing any changes, run:
```bash
npm run build
```
This runs TypeScript validation (`tsc --noEmit`) and compiles `src/functions/[[path]].ts` into `public/_worker.js`.

### Local Testing
To test locally using Cloudflare Pages runtime emulation:
```bash
npm run dev
```
Test with valid upstream tenant routes, for example:
- `http://127.0.0.1:8788/objects.tn/wp-content/uploads/2026/10/nepal-army-rank-hierarchy-insignia-banner.webp?w=400`
- `http://127.0.0.1:8788/objects.tn/wp-content/uploads/2026/10/nepal-army-rank-hierarchy-insignia-banner.webp?cw=600&ch=351`
- `http://127.0.0.1:8788/try-yourself.html`

### Deployment
Since `public/_worker.js` and `.wasm` files are bundled in the repository, pushing to `main` instantly deploys to Cloudflare Pages without needing server-side build steps:
```bash
git push origin main
```
