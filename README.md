# ImagEngine

High-performance edge image optimization and transformation proxy built for Cloudflare Workers using Hono, Photon (Wasm), and resvg (Wasm).

## Features
- **Dynamic Image Resizing & Cropping**: Uses `@cf-wasm/photon` (WebAssembly) for fast, low-memory raster manipulation.
- **SVG Rasterization**: Leverages `@resvg/resvg-wasm` for crisp SVG rendering into raster formats.
- **Multi-Tenant Upstream Resolution**: Resolves upstream origins based on configured tenant mappings (`tn`, `ginfo`, `gcom`, `gname`, `ecn`).
- **Edge Caching**: Comprehensive HTTP cache headers (`Cache-Control`, `CDN-Cache-Control`, `ETag`, 304 Not Modified).
- **Format Fallbacks**: Supports conversion to WebP, PNG, JPEG, AVIF.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Cloudflare Wrangler CLI

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

### Deployment

```bash
npx wrangler login
npm run deploy
```

## URL Structure

```
/[subdomain.]identifier/{path}-{origExt}.{targetExt}
```

Example queries:
- `?w=500&h=300&fit=cover`
- `?avatar=1` (standard 256x256 square crop)
- `?q=80` (quality setting, default 85)
- `?blur=2` or `?sharpen=1`
