import { TENANTS, ENGINE_KEYS, DEFAULT_QUALITY } from './constants';

export function normalizeExt(ext = ''): string {
  return ext.toLowerCase().replace('jpeg', 'jpg');
}

export function basename(path: string): string {
  return path.split('/').pop() || path;
}

export interface ResolvedRoute {
  originUrl: string;
  originHost: string;
  withoutExt: string;
  origExt: string;
  requestedExt: string;
}

export function resolveUpstream(cleanPath: string, query: Record<string, string> = {}): ResolvedRoute | null {
  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const hostParts = parts[0]!.toLowerCase().split('.').filter(Boolean);
  if (!hostParts.length) return null;
  const tenantKey = hostParts.pop()!;
  const tenantDomain = TENANTS[tenantKey];
  if (!tenantDomain) return null;
  const originHost = hostParts.length ? `${hostParts.join('.')}.${tenantDomain}` : tenantDomain;
  const asset = parts.slice(1).join('/');
  const match =
    asset.match(/^(.*)-(jpe?g|png|webp|gif|svg|avif)\.([a-z0-9]+)$/i) ||
    asset.match(/^(.*)\.(jpe?g|png|webp|gif|svg|avif)\.([a-z0-9]+)$/i);
  if (!match) return null;
  const [, basePath, originalExt, targetExt] = match;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!ENGINE_KEYS.has(key)) params.set(key, value);
  }
  if (originalExt.toLowerCase() === 'svg' && !params.has('_v') && !params.has('v')) {
    params.set('_v', 'kbd2');
  }
  const qs = params.toString() ? `?${params}` : '';
  return {
    originUrl: `https://${originHost}/${basePath}.${originalExt}${qs}`,
    originHost,
    withoutExt: basePath,
    origExt: normalizeExt(originalExt),
    requestedExt: normalizeExt(targetExt),
  };
}

export interface TransformOptions {
  avatar: boolean;
  isOg: boolean;
  hasExplicitW: boolean;
  hasExplicitH: boolean;
  width: number | null;
  height: number | null;
  cropWidth: number | null;
  cropHeight: number | null;
  quality: number;
  fit: string;
  position: string;
}

const VALID_FITS = new Set(['cover', 'contain', 'fill', 'inside', 'outside']);
const VALID_POSITIONS = new Set(['top', 'center', 'bottom', 'left', 'right', 'entropy', 'attention']);

export function getOptions(query: Record<string, string>, cleanPath: string): TransformOptions {
  const avatar = query.avatar === '1' || query.avatar === 'true' || cleanPath.includes('/avatar/');
  const isOg = cleanPath.includes('/og/') || cleanPath.endsWith('/og') || /(?:^|\/)og(?:-|\.|$)/i.test(cleanPath);
  const rawW = query.w || query.width;
  const rawH = query.h || query.height;
  const hasExplicitW = Boolean(rawW);
  const hasExplicitH = Boolean(rawH);
  let width = hasExplicitW ? parseInt(rawW!, 10) : null;
  let height = hasExplicitH ? parseInt(rawH!, 10) : null;
  const rawCw = query.cw || query.cropWidth || query.cropwidth;
  const rawCh = query.ch || query.cropHeight || query.cropheight;
  const cropWidth = rawCw ? parseInt(rawCw, 10) : null;
  const cropHeight = rawCh ? parseInt(rawCh, 10) : null;
  const hasCrop = Boolean(cropWidth || cropHeight);

  if (!hasExplicitW && !hasExplicitH && !hasCrop) {
    if (avatar) {
      width = 256;
      height = 256;
    } else if (isOg) {
      width = 1200;
      height = 630;
    }
  }

  const rawQuality = query.q || query.quality;
  let fit = query.fit;
  if (!fit) fit = hasExplicitW && hasExplicitH ? 'fill' : 'cover';

  return {
    avatar,
    isOg,
    hasExplicitW,
    hasExplicitH,
    width,
    height,
    cropWidth,
    cropHeight,
    quality: rawQuality ? Math.min(Math.max(parseInt(rawQuality, 10), 1), 100) : DEFAULT_QUALITY,
    fit: VALID_FITS.has(fit) ? fit : 'cover',
    position: VALID_POSITIONS.has(query.position) ? query.position : avatar ? 'top' : 'center',
  };
}

export function needsTransform(query: Record<string, string>, opts: TransformOptions): boolean {
  return Boolean(
    opts.width ||
      opts.height ||
      opts.cropWidth ||
      opts.cropHeight ||
      opts.avatar ||
      opts.isOg ||
      query.q ||
      query.quality ||
      query.blur ||
      query.sharpen
  );
}
