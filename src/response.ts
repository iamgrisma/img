import { CACHE_HEADER, CDN_CACHE_HEADER } from './constants';

export async function computeEtag(body: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', body);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `"${hex.substring(0, 32)}"`;
}

export interface ImageResponseOpts {
  type: string;
  filename: string;
  host: string;
  engine: string;
  etag?: string;
  extraHeaders?: Record<string, string>;
}

export function imageResponse(body: Uint8Array, opts: ImageResponseOpts): Response {
  const headers = new Headers();
  headers.set('Content-Type', opts.type);
  headers.set('Content-Length', body.byteLength.toString());
  headers.set('Content-Disposition', `inline; filename="${opts.filename}"`);
  headers.set('Cache-Control', CACHE_HEADER);
  headers.set('CDN-Cache-Control', CDN_CACHE_HEADER);
  headers.set('Cloudflare-CDN-Cache-Control', CDN_CACHE_HEADER);
  headers.set('X-Render-Engine', opts.engine);
  headers.set('X-Origin-Host', opts.host);
  if (opts.etag) headers.set('ETag', opts.etag);
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) {
      headers.set(k, v);
    }
  }
  return new Response(body, { status: 200, headers });
}

export function notModifiedResponse(etag: string): Response {
  return new Response(null, { status: 304, headers: { ETag: etag } });
}

export function errorResponse(status: number, message: string): Response {
  const isNotFound = status === 404;
  const headers = new Headers();
  headers.set('Content-Type', 'application/json; charset=utf-8');

  if (isNotFound) {
    // 300 seconds (5 mins) negative caching to protect against 404 DDoS / quota drain
    const notFoundCache = 'public, max-age=300, s-maxage=300';
    headers.set('Cache-Control', notFoundCache);
    headers.set('CDN-Cache-Control', notFoundCache);
    headers.set('Cloudflare-CDN-Cache-Control', notFoundCache);
  } else {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }

  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers,
  });
}
