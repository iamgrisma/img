# ImagEngine

High-performance edge image optimization and transformation proxy built for **Cloudflare Pages** (Functions) & Workers using Hono, Photon (Wasm), and resvg (Wasm).

## Features
- **Dynamic Image Resizing & Cropping**: Uses `@cf-wasm/photon` (WebAssembly) for fast, low-memory raster manipulation.
- **SVG Rasterization**: Leverages `@resvg/resvg-wasm` for crisp SVG rendering into raster formats (PNG, WebP).
- **Multi-Tenant Upstream Resolution**: Resolves upstream origins based on configured tenant mappings (`tn`, `ginfo`, `gcom`, `gname`, `ecn`).
- **Edge Caching**: Comprehensive HTTP cache headers (`Cache-Control`, `CDN-Cache-Control`, `ETag`, 304 Not Modified).
- **Format Fallbacks**: Supports conversion between JPG, PNG, and WebP.
- **Cloudflare Pages Architecture**: Runs natively on Cloudflare Pages Functions via `functions/[[path]].ts` with static asset routing (`public/`).

## Getting Started

### Installation

```bash
npm install
```

### Local Development (Cloudflare Pages)

```bash
npm run dev
```

Starts the local Pages development server on `http://127.0.0.1:8788`.

### Deployment to Cloudflare Pages

```bash
npm run deploy
```

*(Or connect this Git repository directly to Cloudflare Pages dashboard with build output directory set to `public`)*.

## URL Structure

ImagEngine supports both slug-based conversion and standard query-parameter-based conversion:

### 1. Slug Extension Conversion:
```
/[subdomain.]identifier/{path}-{origExt}.{targetExt}
/[subdomain.]identifier/{path}.{origExt}.{targetExt}
```
Example:
- `/object.gcom/wp-content/uploads/2020/10/History-of-Internet-in-Nepal-jpg.webp?w=400`
- `/ginfo/profile-svg.webp?w=200`

### 2. Direct Path with Query Parameter:
```
/[subdomain.]identifier/{path}.{origExt}?format={targetExt}
```
Example:
- `/object.gcom/wp-content/uploads/2020/10/History-of-Internet-in-Nepal.jpg?format=webp&w=400`

### Transformation Parameters
- `w` or `width`: Target width in pixels
- `h` or `height`: Target height in pixels
- `fit`: `cover` (default), `contain`, `fill`, `inside`, `outside`
- `position`: `top`, `center`, `bottom`, `left`, `right`
- `avatar`: `1` (shortcuts to 256x256 square crop with top alignment)
- `q` or `quality`: 1 to 100 (default: 85)
- `blur`: Gaussian blur radius (e.g. `?blur=5`)
- `sharpen`: `1` or `true`
