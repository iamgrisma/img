import { PhotonImage, resize, crop, gaussian_blur, sharpen, SamplingFilter } from '@cf-wasm/photon';
import { Resvg } from '@cf-wasm/resvg';
import {
  MIME,
  SVG_MAX_SIZE,
  RASTER_MAX_SIZE,
  FETCH_TIMEOUT_MS,
  DEFAULT_SVG_WIDTH,
} from './constants';
import { normalizeExt } from './routing';
import type { TransformOptions } from './routing';

export interface SourceData {
  type: string;
  svg: string;
  raster: Uint8Array | null;
}

export interface TransformResult {
  buffer: Uint8Array;
  type: string;
  engine: string;
  actualExt: string;
}

export async function fetchSource(url: string): Promise<SourceData> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'imagengine/1.0' },
  });
  if (!response.ok) {
    const err = new Error(`Upstream not found (${response.status})`);
    (err as any).status = response.status;
    throw err;
  }
  const type = (response.headers.get('content-type') || '').toLowerCase();
  const isSvg = type.includes('svg') || url.includes('.svg');
  if (isSvg) return { type, svg: await response.text(), raster: null };
  return { type, svg: '', raster: new Uint8Array(await response.arrayBuffer()) };
}

function cleanSvg(svg: string): string {
  return svg.replace(/&[a-zA-Z0-9#]*…/g, '…').replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)/g, '&amp;');
}

async function rasterizeSvg(svgText: string, targetWidth: number): Promise<Uint8Array> {
  const resvg = new Resvg(cleanSvg(svgText), {
    fitTo: { mode: 'width', value: targetWidth },
    background: 'rgba(255,255,255,0)',
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

interface ResizePlan {
  resizeW: number;
  resizeH: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  needsCrop: boolean;
}

function cropOffset(d: number, t: number, p: string): number {
  if (p === 'top' || p === 'left') return 0;
  if (p === 'bottom' || p === 'right') return Math.max(0, d - t);
  return Math.max(0, Math.floor((d - t) / 2));
}

function planResize(srcW: number, srcH: number, tw: number, th: number, fit: string, pos: string): ResizePlan {
  const sr = srcW / srcH;
  const tr = tw / th;
  if (fit === 'fill') {
    return { resizeW: tw, resizeH: th, cropX: 0, cropY: 0, cropW: tw, cropH: th, needsCrop: false };
  }
  if (fit === 'cover' || fit === 'outside') {
    let rw: number;
    let rh: number;
    if (sr > tr) {
      rh = th;
      rw = Math.round(th * sr);
    } else {
      rw = tw;
      rh = Math.round(tw / sr);
    }
    return {
      resizeW: rw,
      resizeH: rh,
      cropX: cropOffset(rw, tw, pos),
      cropY: cropOffset(rh, th, pos),
      cropW: tw,
      cropH: th,
      needsCrop: rw > tw || rh > th,
    };
  }
  if (fit === 'contain') {
    let rw: number;
    let rh: number;
    if (sr > tr) {
      rw = tw;
      rh = Math.round(tw / sr);
    } else {
      rh = th;
      rw = Math.round(th * sr);
    }
    return { resizeW: rw, resizeH: rh, cropX: 0, cropY: 0, cropW: rw, cropH: rh, needsCrop: false };
  }
  if (fit === 'inside') {
    const s = Math.min(tw / srcW, th / srcH, 1);
    const rw = Math.max(1, Math.round(srcW * s));
    const rh = Math.max(1, Math.round(srcH * s));
    return { resizeW: rw, resizeH: rh, cropX: 0, cropY: 0, cropW: rw, cropH: rh, needsCrop: false };
  }
  return { resizeW: tw, resizeH: th, cropX: 0, cropY: 0, cropW: tw, cropH: th, needsCrop: false };
}

function safeCrop(img: PhotonImage, x: number, y: number, w: number, h: number): PhotonImage {
  const sw = img.get_width();
  const sh = img.get_height();
  const x1 = Math.max(0, Math.min(x, sw - 1));
  const y1 = Math.max(0, Math.min(y, sh - 1));
  const x2 = Math.min(sw, Math.max(x1 + 1, x1 + w));
  const y2 = Math.min(sh, Math.max(y1 + 1, y1 + h));
  return crop(img, x1, y1, x2, y2);
}

function encodeImage(
  img: PhotonImage,
  ext: string,
  q: number
): { buffer: Uint8Array; type: string; actualExt: string } {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return { buffer: img.get_bytes_jpeg(q), type: MIME.jpg, actualExt: 'jpg' };
    case 'webp':
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: 'webp' };
    case 'png':
      return { buffer: img.get_bytes(), type: MIME.png, actualExt: 'png' };
    case 'avif':
      // Fallback to webp as Photon wasm does not have AVIF encoder
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: 'webp' };
    case 'gif':
      return { buffer: img.get_bytes(), type: MIME.png, actualExt: 'png' };
    default:
      return { buffer: img.get_bytes(), type: MIME.png, actualExt: 'png' };
  }
}

export async function transform(
  source: SourceData,
  query: Record<string, string>,
  opts: TransformOptions,
  targetExt: string
): Promise<TransformResult> {
  const ext = normalizeExt(targetExt);
  if (source.svg) {
    if (!source.svg.includes('<svg')) {
      const e = new Error('Invalid SVG');
      (e as any).status = 404;
      throw e;
    }
    if (source.svg.length > SVG_MAX_SIZE) {
      const e = new Error('SVG too large');
      (e as any).status = 413;
      throw e;
    }
    const png = await rasterizeSvg(source.svg, opts.width || DEFAULT_SVG_WIDTH);
    const more = opts.height || opts.cropWidth || opts.cropHeight || query.blur || query.sharpen || ext !== 'png';
    if (!more) return { buffer: png, type: MIME.png, engine: 'resvg-svg', actualExt: 'png' };
    return transformRaster(png, query, opts, ext, 'resvg-svg');
  }
  if (!source.raster) {
    const e = new Error('No raster data');
    (e as any).status = 404;
    throw e;
  }
  if (source.raster.byteLength > RASTER_MAX_SIZE) {
    const e = new Error('Raster too large');
    (e as any).status = 413;
    throw e;
  }
  return transformRaster(source.raster, query, opts, ext, 'photon-raster');
}

async function transformRaster(
  input: Uint8Array,
  query: Record<string, string>,
  opts: TransformOptions,
  ext: string,
  engine: string
): Promise<TransformResult> {
  let image = PhotonImage.new_from_byteslice(input);
  const toFree: PhotonImage[] = [];
  let sw = image.get_width();
  let sh = image.get_height();

  // Guard: if uncompressed pixels exceed 36 megapixels (~144MB raw RGBA), reject with 413 to prevent Worker Out-of-Memory
  if (sw * sh > 36_000_000) {
    image.free();
    const e = new Error(`Image resolution too large (${sw}x${sh}). Maximum supported is 36 megapixels.`);
    (e as any).status = 413;
    throw e;
  }

  if (opts.cropWidth || opts.cropHeight) {
    const cw = opts.cropWidth ? Math.min(opts.cropWidth, sw) : sw;
    const ch = opts.cropHeight ? Math.min(opts.cropHeight, sh) : sh;
    const old = image;
    image = safeCrop(image, Math.max(0, Math.floor((sw - cw) / 2)), Math.max(0, Math.floor((sh - ch) / 2)), cw, ch);
    toFree.push(old);
    sw = image.get_width();
    sh = image.get_height();
  }

  if (opts.width && opts.height) {
    const p = planResize(sw, sh, opts.width, opts.height, opts.fit, opts.position);
    const old = image;
    image = resize(image, p.resizeW, p.resizeH, SamplingFilter.Lanczos3);
    toFree.push(old);
    if (p.needsCrop) {
      const o2 = image;
      image = safeCrop(image, p.cropX, p.cropY, p.cropW, p.cropH);
      toFree.push(o2);
    }
  } else if (opts.width || opts.height) {
    let rw: number;
    let rh: number;
    if (opts.width) {
      rw = opts.width;
      rh = Math.max(1, Math.round(sh * (opts.width / sw)));
    } else {
      rh = opts.height!;
      rw = Math.max(1, Math.round(sw * (opts.height! / sh)));
    }
    const old = image;
    image = resize(image, rw, rh, SamplingFilter.Lanczos3);
    toFree.push(old);
  }

  if (query.blur) {
    const radius = Math.min(Math.max(parseFloat(query.blur), 1), 100);
    gaussian_blur(image, Math.round(radius));
  }

  if (query.sharpen === 'true' || query.sharpen === '1') {
    sharpen(image);
  }

  const enc = encodeImage(image, ext, opts.quality);
  for (const i of toFree) {
    try {
      i.free();
    } catch {}
  }
  try {
    image.free();
  } catch {}
  return { buffer: enc.buffer, type: enc.type, engine, actualExt: enc.actualExt };
}
