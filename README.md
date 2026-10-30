# ImagEngine

High-performance, zero-latency edge image optimization and transformation proxy built for **Cloudflare Pages** (Advanced Mode) and **Cloudflare Workers**. Powered by **Hono**, **Photon** (WebAssembly), and **resvg** (WebAssembly).

---

## Features

- **WebAssembly Performance**: Utilizes `@cf-wasm/photon` for fast raster image processing and `@cf-wasm/resvg` for pixel-perfect SVG rasterization directly on edge isolates.
- **Embedded Typography & Font Rendering**: Pre-bundles core TrueType fonts in-memory (`Plus Jakarta Sans`, `Inter`, `Kalimati`) so that vector SVGs with text nodes (including English and Devanagari/Nepali scripts, such as `fontsdir` cards) render with 100% glyph accuracy on serverless edge isolates without OS dependencies.
- **Zero-Config Cloudflare Pages Deployment**: Runs via Pages Advanced Mode (`public/_worker.js`), deploying in seconds with zero build commands required in the Cloudflare dashboard.
- **Crash-Proof Crop-First Resizing**: Calculates target aspect ratios and crops before resizing in `fit=cover` mode, eliminating multi-megapixel intermediate buffer spikes and CPU timeouts.
- **4x Upscale Protection**: Clamps upscale requests exceeding 4x source dimensions to prevent memory exhaustion and edge denial-of-service attempts.
- **Lossless Byte-Level Rotation**: Implements pure RGBA byte-slice rotation for 90°, 180°, and 270° angles to eliminate the color washout and channel shifts common in WASM implementations.
- **Dual URL Syntax**: Supports both declarative slug extension conversion (`path-jpg.webp`) and query-parameter-based conversion (`path.jpg?format=webp`).
- **Comprehensive Edge Caching**: Emits 1-year immutable cache headers (`Cache-Control`, `CDN-Cache-Control`, `Cloudflare-CDN-Cache-Control`), SHA-256 ETags with 304 Not Modified support, and 300-second negative caching on 404 responses.
- **Interactive Sandbox & Playground**: Includes a responsive, single-page test environment (`/try-yourself.html`) with live parameter controls and real-time dimension badges.

---

## Architecture and Tenant Resolution

ImagEngine resolves upstream origins dynamically using configured tenant prefixes in the first path segment:

| Tenant Key | Target Domain | Supported Upstream Pattern |
|:---|:---|:---|
| `tn` | `topnepali.com` | `objects.tn`, `img.tn`, `tn` |
| `ginfo` | `grisma.info.np` | `ginfo`, `cdn.ginfo` |
| `gcom` | `grisma.com.np` | `object.gcom`, `gcom` |
| `gname` | `grisma.name.np` | `gname` |
| `ecn` | `election.gov.np` | `ecn`, `result.ecn` |

### URL Patterns

#### 1. Slug Extension Conversion (Clean URLs)
```
/{subdomain.}{tenant}/{path}-{origExt}.{targetExt}?{params}
/{subdomain.}{tenant}/{path}.{origExt}.{targetExt}?{params}
```
Example:
```
https://imagengine.pages.dev/objects.tn/wp-content/uploads/2026/10/banner-jpg.webp?w=600&q=85
```

#### 2. Query Parameter Format Conversion
```
/{subdomain.}{tenant}/{path}.{origExt}?format={targetExt}&{params}
```
Example:
```
https://imagengine.pages.dev/objects.tn/wp-content/uploads/2026/10/banner.jpg?format=webp&w=600
```

---

## Query Parameter Reference

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `w`, `width` | `integer` | source | Target width in pixels (1 to 2560). Subject to 4x upscale ceiling. |
| `h`, `height` | `integer` | source | Target height in pixels (1 to 2560). Subject to 4x upscale ceiling. |
| `cw`, `cropwidth` | `integer` | source | Source crop width in pixels. Crops from center before resizing. |
| `ch`, `cropheight` | `integer` | source | Source crop height in pixels. Crops from center before resizing. |
| `fit` | `string` | `cover` | Resize fitting strategy: `cover`, `contain`, `fill`, `inside`, `outside`. |
| `position` | `string` | `center` | Crop anchor position: `top`, `bottom`, `left`, `right`, `center`. |
| `format` | `string` | source / `webp` | Output image format: `webp`, `png`, `jpg`, `jpeg`. |
| `q`, `quality` | `integer` | `85` | Compression quality from `1` to `100` (applicable to WebP and JPEG). |
| `rotate` | `number` | `0` | Rotation angle in degrees (`90`, `180`, `270` lossless byte permutation). |
| `flip`, `fliph` | `boolean` | `false` | Flip image horizontally. |
| `flop`, `flipv` | `boolean` | `false` | Flip image vertically. |
| `grayscale` | `boolean` | `false` | Convert image to grayscale using human-eye luminance correction. |
| `blur` | `number` | `0` | Gaussian blur radius (1 to 100). |
| `sharpen` | `boolean` | `false` | Apply unsharp sharpening filter. |
| `avatar` | `boolean` | `false` | Shortcut preset for `256x256`, `fit=cover`, `position=top`. |

---

## Safety Guards and Invariants

1. **4x Upscale Ceiling**: An image with native resolution `400x300` requested at `w=1800` will clamp to `1600` (4x original width), preventing memory spikes from unbounded upscaling.
2. **Megapixel Cap**: Source rasters with uncompressed pixel buffers exceeding 36 megapixels (~144MB raw RGBA) are rejected with HTTP 413 to protect isolate memory boundaries.
3. **Payload Limits**: Maximum raster payload is 25MB (`RASTER_MAX_SIZE`), and maximum SVG payload is 2MB (`SVG_MAX_SIZE`).
4. **Fetch Timeout**: Upstream fetches abort after 5,000ms (`FETCH_TIMEOUT_MS`).
5. **Negative Caching**: HTTP 404 responses are cached for 300 seconds at the edge to mitigate origin scan and DDoS attempts.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Starts the Cloudflare Pages local development server at `http://127.0.0.1:8788`.

### Compile Worker Bundle
```bash
npm run build
```
Type-checks TypeScript files and bundles `src/functions/[[path]].ts` into `public/_worker.js`.

---

## Deployment to Cloudflare Pages

ImagEngine uses **Cloudflare Pages Advanced Mode**. Pre-compiled Worker assets (`public/_worker.js` and `.wasm` files) are checked directly into the repository.

1. Connect your GitHub repository to Cloudflare Pages.
2. In the deployment configuration:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `public`
3. Deploy. Cloudflare Pages serves static assets from `public/` and dynamically executes `public/_worker.js` for all matching tenant routes.

---

## Contributor and Agent Guidelines

For internal design details, invariant enforcement, memory management rules, and coding standards, refer to [AGENTS.md](AGENTS.md).

---

## License

This project is licensed under the [MIT License](LICENSE).
