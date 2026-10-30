export const TENANTS: Record<string, string> = {
  tn: 'topnepali.com',
  ginfo: 'grisma.info.np',
  gcom: 'grisma.com.np',
  gname: 'grisma.name.np',
  ecn: 'election.gov.np',
};

export const ENGINE_KEYS = new Set([
  'format', 'w', 'width', 'h', 'height', 'q', 'quality', 'avatar', 'fit', 'position',
  'blur', 'sharpen', '__path', 'cw', 'cropwidth', 'cropWidth', 'ch', 'cropheight', 'cropHeight',
  'rotate', 'flip', 'fliph', 'flop', 'flipv', 'grayscale', 'greyscale',
]);

export const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml; charset=utf-8',
};

export const CACHE_HEADER = 'public, max-age=31536000, s-maxage=31536000, immutable';
export const CDN_CACHE_HEADER = 'public, max-age=31536000, immutable';
export const SVG_MAX_SIZE = 2_000_000;
export const RASTER_MAX_SIZE = 25_000_000;
export const FETCH_TIMEOUT_MS = 5_000;
export const DEFAULT_SVG_WIDTH = 1200;
export const DEFAULT_QUALITY = 85;
export const RESIZE_FILTER_LANCZOS3 = 5;
export const MAX_DIMENSION = 3840;
export const MAX_UPSCALE_FACTOR = 4;
