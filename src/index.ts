import { Hono } from 'hono';
import { resolveUpstream, normalizeExt, getOptions, needsTransform, basename } from './routing';
import { fetchSource, transform } from './processor';
import { imageResponse, errorResponse, notModifiedResponse, computeEtag } from './response';
import { MIME } from './constants';

const app = new Hono();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, If-None-Match');
  c.header('Access-Control-Expose-Headers', 'ETag, Cache-Control, X-Render-Engine, X-Origin-Host, X-Format-Fallback');
  if (c.req.method === 'OPTIONS') return c.body(null, 200);
  await next();
});

app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const cleanPath = url.pathname.replace(/^\/+|\/+$/g, '');

  if (cleanPath === 'favicon.ico') return c.body(null, 204);
  if (!cleanPath) {
    if ((c.env as any)?.ASSETS) {
      return (c.env as any).ASSETS.fetch(c.req.raw);
    }
    return c.json(
      { status: 'ok', service: 'imagengine' },
      200,
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    );
  }
  if (cleanPath === 'api' || cleanPath === 'health') {
    return c.json(
      { status: 'ok', service: 'imagengine' },
      200,
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    );
  }

  function sendResponse(res: Response): Response {
    if (cache && c.executionCtx) {
      // Only cache 200 OK (1 year) and 404 Not Found (negative caching 300s)
      if (res.status === 200 || res.status === 404) {
        try {
          c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()));
        } catch {}
      }
    }
    return res;
  }

  const route = resolveUpstream(cleanPath, query);
  if (!route) {
    return sendResponse(
      errorResponse(404, 'Route not found. Required: /[subdomain.]identifier/{path}-{origExt}.{targetExt}')
    );
  }

  // Check programmatic Cloudflare Edge Cache API
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  let cache: Cache | null = null;
  try {
    cache = (caches as any).default;
  } catch {}

  if (cache) {
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const ifNoneMatch = c.req.header('If-None-Match');
        const cachedEtag = cachedResponse.headers.get('ETag');
        if (ifNoneMatch && cachedEtag && ifNoneMatch === cachedEtag) {
          return notModifiedResponse(cachedEtag);
        }
        return cachedResponse;
      }
    } catch {}
  }

  const { originUrl, originHost, withoutExt, origExt, requestedExt: routeExt } = route;
  const requestedExt = normalizeExt(query.format || routeExt || 'webp');

  let source;
  try {
    source = await fetchSource(originUrl);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    const status = e.status || 502;
    const msg = e.status === 404 ? 'Upstream image not found' : `Upstream error: ${e.message}`;
    return sendResponse(errorResponse(status, msg));
  }

  if (!source.svg && !source.raster) {
    return sendResponse(errorResponse(404, 'Upstream asset empty'));
  }

  const opts = getOptions(query, cleanPath);
  const transformed = needsTransform(query, opts);
  const sameExt = origExt === requestedExt;
  const webpSource = source.type.includes('webp') || origExt === 'webp';
  const ifNoneMatch = c.req.header('If-None-Match');

  if (!transformed && source.svg && requestedExt === 'svg') {
    const body = new TextEncoder().encode(source.svg);
    const etag = await computeEtag(body);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);
    return sendResponse(
      imageResponse(body, {
        type: MIME.svg,
        filename: `${basename(withoutExt)}.svg`,
        host: originHost,
        engine: 'edge-passthrough',
        etag,
      })
    );
  }

  if (!transformed && source.raster && (sameExt || (requestedExt === 'webp' && webpSource))) {
    const body = source.raster;
    const etag = await computeEtag(body);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);
    return sendResponse(
      imageResponse(body, {
        type: MIME[requestedExt] || source.type || 'application/octet-stream',
        filename: `${basename(withoutExt)}.${requestedExt}`,
        host: originHost,
        engine: 'edge-passthrough',
        etag,
      })
    );
  }

  try {
    const result = await transform(source, query, opts, requestedExt);
    const etag = await computeEtag(result.buffer);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);

    const extraHeaders: Record<string, string> = {};
    if (result.actualExt !== requestedExt) {
      extraHeaders['X-Format-Fallback'] = `${requestedExt}→${result.actualExt}`;
    }

    return sendResponse(
      imageResponse(result.buffer, {
        type: result.type,
        filename: `${basename(withoutExt) || 'asset'}.${result.actualExt}`,
        host: originHost,
        engine: result.engine,
        etag,
        extraHeaders,
      })
    );
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    return errorResponse(e.status || 500, e.message || 'Processing failed');
  }
});

export default app;
