import {
  PhotonImage,
  resize,
  crop,
  gaussian_blur,
  sharpen,
  fliph,
  flipv,
  grayscale_human_corrected,
  SamplingFilter,
} from '@cf-wasm/photon';
import { Resvg } from '@cf-wasm/resvg';
import {
  MIME,
  SVG_MAX_SIZE,
  RASTER_MAX_SIZE,
  FETCH_TIMEOUT_MS,
  DEFAULT_SVG_WIDTH,
  MAX_DIMENSION,
  MAX_UPSCALE_FACTOR,
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

function cropOffset(d: number, t: number, p: string): number {
  if (p === 'top' || p === 'left') return 0;
  if (p === 'bottom' || p === 'right') return Math.max(0, d - t);
  return Math.max(0, Math.floor((d - t) / 2));
}

function executeResize(
  img: PhotonImage,
  tw: number,
  th: number,
  fit: string,
  pos: string,
  toFree: PhotonImage[]
): PhotonImage {
  const sw = img.get_width();
  const sh = img.get_height();
  const sr = sw / sh;
  const tr = tw / th;

  if (fit === 'fill') {
    const old = img;
    const res = resize(img, tw, th, SamplingFilter.Lanczos3);
    toFree.push(old);
    return res;
  }

  if (fit === 'contain') {
    let rw: number;
    let rh: number;
    if (sr > tr) {
      rw = tw;
      rh = Math.max(1, Math.round(tw / sr));
    } else {
      rh = th;
      rw = Math.max(1, Math.round(th * sr));
    }
    const old = img;
    const res = resize(img, rw, rh, SamplingFilter.Lanczos3);
    toFree.push(old);
    return res;
  }

  if (fit === 'inside') {
    const s = Math.min(tw / sw, th / sh, 1);
    const rw = Math.max(1, Math.round(sw * s));
    const rh = Math.max(1, Math.round(sh * s));
    const old = img;
    const res = resize(img, rw, rh, SamplingFilter.Lanczos3);
    toFree.push(old);
    return res;
  }

  // Default: 'cover' (and 'outside')
  // Crop on source FIRST to prevent gigantic upscaled intermediate buffers and CPU chokes
  let cropW = sw;
  let cropH = sh;
  if (sr > tr) {
    cropH = sh;
    cropW = Math.max(1, Math.round(sh * tr));
  } else {
    cropW = sw;
    cropH = Math.max(1, Math.round(sw / tr));
  }

  const cropX = cropOffset(sw, cropW, pos);
  const cropY = cropOffset(sh, cropH, pos);

  let current = img;
  if (cropW < sw || cropH < sh) {
    const old = current;
    current = safeCrop(current, cropX, cropY, cropW, cropH);
    toFree.push(old);
  }

  if (current.get_width() !== tw || current.get_height() !== th) {
    const old = current;
    current = resize(current, tw, th, SamplingFilter.Lanczos3);
    toFree.push(old);
  }

  return current;
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

function rotateLossless(image: PhotonImage, degrees: number): PhotonImage {
  const norm = ((Math.round(degrees) % 360) + 360) % 360;
  if (norm === 0) return image;

  const w = image.get_width();
  const h = image.get_height();
  const src = image.get_raw_pixels();

  if (norm === 90) {
    const newW = h;
    const newH = w;
    const dest = new Uint8Array(newW * newH * 4);
    for (let y = 0; y < h; y++) {
      const srcRow = y * w * 4;
      for (let x = 0; x < w; x++) {
        const srcIdx = srcRow + x * 4;
        const destIdx = (x * newW + (h - 1 - y)) * 4;
        dest[destIdx] = src[srcIdx];
        dest[destIdx + 1] = src[srcIdx + 1];
        dest[destIdx + 2] = src[srcIdx + 2];
        dest[destIdx + 3] = src[srcIdx + 3];
      }
    }
    return new PhotonImage(dest, newW, newH);
  }

  if (norm === 180) {
    const dest = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      const srcRow = y * w * 4;
      const destRow = (h - 1 - y) * w * 4;
      for (let x = 0; x < w; x++) {
        const srcIdx = srcRow + x * 4;
        const destIdx = destRow + (w - 1 - x) * 4;
        dest[destIdx] = src[srcIdx];
        dest[destIdx + 1] = src[srcIdx + 1];
        dest[destIdx + 2] = src[srcIdx + 2];
        dest[destIdx + 3] = src[srcIdx + 3];
      }
    }
    return new PhotonImage(dest, w, h);
  }

  if (norm === 270) {
    const newW = h;
    const newH = w;
    const dest = new Uint8Array(newW * newH * 4);
    for (let y = 0; y < h; y++) {
      const srcRow = y * w * 4;
      for (let x = 0; x < w; x++) {
        const srcIdx = srcRow + x * 4;
        const destIdx = ((w - 1 - x) * newW + y) * 4;
        dest[destIdx] = src[srcIdx];
        dest[destIdx + 1] = src[srcIdx + 1];
        dest[destIdx + 2] = src[srcIdx + 2];
        dest[destIdx + 3] = src[srcIdx + 3];
      }
    }
    return new PhotonImage(dest, newW, newH);
  }

  const nearest = Math.round(norm / 90) * 90;
  return rotateLossless(image, nearest);
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
    case 'png':
      return { buffer: img.get_bytes(), type: MIME.png, actualExt: 'png' };
    case 'webp':
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: 'webp' };
    case 'avif':
    case 'gif':
    default:
      // Always fall back to webp for modern compression and smaller size
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: 'webp' };
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

  // Upscale limit: Maximum 4x of image dimensions (clamped at MAX_DIMENSION)
  // If user requests larger than 4x, sticks at 4x (e.g. 400 requested as 1800 produces 1600)
  const maxAllowedW = Math.min(sw * MAX_UPSCALE_FACTOR, MAX_DIMENSION);
  const maxAllowedH = Math.min(sh * MAX_UPSCALE_FACTOR, MAX_DIMENSION);

  const targetW = opts.width ? Math.min(opts.width, maxAllowedW) : null;
  const targetH = opts.height ? Math.min(opts.height, maxAllowedH) : null;

  if (targetW && targetH) {
    image = executeResize(image, targetW, targetH, opts.fit, opts.position, toFree);
  } else if (targetW || targetH) {
    let rw: number;
    let rh: number;
    if (targetW) {
      rw = targetW;
      rh = Math.max(1, Math.round(sh * (targetW / sw)));
    } else {
      rh = targetH!;
      rw = Math.max(1, Math.round(sw * (targetH! / sh)));
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

  if (query.rotate) {
    const angle = parseFloat(query.rotate);
    if (!isNaN(angle) && angle !== 0) {
      const old = image;
      image = rotateLossless(image, angle);
      toFree.push(old);
    }
  }

  if (
    query.flip === 'h' ||
    query.flip === 'true' ||
    query.flip === '1' ||
    query.fliph === '1' ||
    query.fliph === 'true'
  ) {
    fliph(image);
  }

  if (
    query.flip === 'v' ||
    query.flop === 'true' ||
    query.flop === '1' ||
    query.flipv === '1' ||
    query.flipv === 'true'
  ) {
    flipv(image);
  }

  if (
    query.grayscale === 'true' ||
    query.grayscale === '1' ||
    query.greyscale === 'true' ||
    query.greyscale === '1'
  ) {
    grayscale_human_corrected(image);
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
