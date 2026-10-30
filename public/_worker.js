var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
}, "bufferToFormData");

// ../../node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// ../../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match3, index) => {
    const mark = `@${index}`;
    groups.push([mark, match3]);
    return mark;
  });
  return {
    groups,
    path
  };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") return "*";
  const match3 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match3) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match3[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match3[1],
        new RegExp(`^${match3[2]}(?=/${next})`)
      ] : [
        label,
        match3[1],
        new RegExp(`^${match3[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match3[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match3) => {
      try {
        return decoder(match3);
      } catch {
        return match3;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2))) break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
}, "resolveCallback");

// ../../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  }, "text");
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../../node_modules/hono/dist/adapter/cloudflare-pages/handler.js
var handle = /* @__PURE__ */ __name((app2) => (eventContext) => {
  return app2.fetch(eventContext.request, {
    ...eventContext.env,
    eventContext
  }, {
    waitUntil: eventContext.waitUntil,
    passThroughOnException: eventContext.passThroughOnException,
    props: {}
  });
}, "handle");

// ../../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler = i === middleware.length && next || void 0;
      if (handler) try {
        res = await handler(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class Hono2 {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) handler = r.handler;
      else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions2 = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions2(c));
      if (res) return res;
      await next();
    }, "handler");
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  }, "request");
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../../node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match3 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match4 = path2.match(matcher[0]);
    if (!match4) return [[], emptyParam];
    const index = match4.indexOf("", 1);
    return [matcher[1][index], match4];
  }), "match");
  this.match = match3;
  return match3(method, path);
}
__name(match, "match");

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === ".*" || a === "(?:|/.*)") return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class Node2 {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match3, metaChar) => metaChar ? `\\${metaChar}` : match3 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match3 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) if (buildWildcardRegExp(k).test(path)) return [...middleware[k]];
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes2 = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes2]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) if (!middleware[m][path]) {
        this.#insertPath(m, path);
        middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
      }
      for (const handlerMap of [middleware, routes2]) for (const m of methods) for (const p in handlerMap[m]) re.test(p) && handlerMap[m][p].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!routes2[m][path2]) {
        this.#insertPath(m, path2);
        routes2[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware["ALL"], path2) || [];
      }
      routes2[m][path2].push([handler, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes2 = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes2]) for (const path in r) {
      const handlers = r[path];
      const pathData = trie.paths[path];
      if (!pathData) {
        staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
        map[key] = paramReplacementMap[pathData[1][i][1]];
        return map;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// ../../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes2 = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes2.length; i2 < len2; i2++) router.add(...routes2[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// ../../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  static {
    __name(this, "Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset2 = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset2;
                offset2 += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name)) params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name)) params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// ../constants.ts
var TENANTS = {
  tn: "topnepali.com",
  ginfo: "grisma.info.np",
  gcom: "grisma.com.np",
  gname: "grisma.name.np",
  ecn: "election.gov.np"
};
var ENGINE_KEYS = /* @__PURE__ */ new Set([
  "format",
  "w",
  "width",
  "h",
  "height",
  "q",
  "quality",
  "avatar",
  "fit",
  "position",
  "blur",
  "sharpen",
  "__path",
  "cw",
  "cropwidth",
  "cropWidth",
  "ch",
  "cropheight",
  "cropHeight",
  "rotate",
  "flip",
  "fliph",
  "flop",
  "flipv",
  "grayscale",
  "greyscale"
]);
var MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml; charset=utf-8"
};
var CACHE_HEADER = "public, max-age=31536000, s-maxage=31536000, immutable";
var CDN_CACHE_HEADER = "public, max-age=31536000, immutable";
var SVG_MAX_SIZE = 2e6;
var RASTER_MAX_SIZE = 25e6;
var FETCH_TIMEOUT_MS = 5e3;
var DEFAULT_SVG_WIDTH = 1200;
var DEFAULT_QUALITY = 85;
var MAX_DIMENSION = 3840;
var MAX_UPSCALE_FACTOR = 4;

// ../routing.ts
function normalizeExt(ext = "") {
  return ext.toLowerCase().replace("jpeg", "jpg");
}
__name(normalizeExt, "normalizeExt");
function basename(path) {
  return path.split("/").pop() || path;
}
__name(basename, "basename");
function resolveUpstream(cleanPath, query = {}) {
  const parts = cleanPath.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const hostParts = parts[0].toLowerCase().split(".").filter(Boolean);
  if (!hostParts.length) return null;
  const tenantKey = hostParts.pop();
  const tenantDomain = TENANTS[tenantKey];
  if (!tenantDomain) return null;
  const originHost = hostParts.length ? `${hostParts.join(".")}.${tenantDomain}` : tenantDomain;
  const asset = parts.slice(1).join("/");
  let match3 = asset.match(/^(.*)-(jpe?g|png|webp|gif|svg|avif)\.([a-z0-9]+)$/i) || asset.match(/^(.*)\.(jpe?g|png|webp|gif|svg|avif)\.([a-z0-9]+)$/i);
  let basePath = "";
  let originalExt = "";
  let targetExt = "";
  if (match3) {
    [, basePath, originalExt, targetExt] = match3;
  } else {
    const singleMatch = asset.match(/^(.*)\.(jpe?g|png|webp|gif|svg|avif)$/i);
    if (singleMatch) {
      [, basePath, originalExt] = singleMatch;
      targetExt = query.format || originalExt;
    } else {
      return null;
    }
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!ENGINE_KEYS.has(key)) params.set(key, value);
  }
  if (originalExt.toLowerCase() === "svg" && !params.has("_v") && !params.has("v")) {
    params.set("_v", "kbd2");
  }
  const qs = params.toString() ? `?${params}` : "";
  return {
    originUrl: `https://${originHost}/${basePath}.${originalExt}${qs}`,
    originHost,
    withoutExt: basePath,
    origExt: normalizeExt(originalExt),
    requestedExt: normalizeExt(targetExt)
  };
}
__name(resolveUpstream, "resolveUpstream");
var VALID_FITS = /* @__PURE__ */ new Set(["cover", "contain", "fill", "inside", "outside"]);
var VALID_POSITIONS = /* @__PURE__ */ new Set(["top", "center", "bottom", "left", "right", "entropy", "attention"]);
function getOptions(query, cleanPath) {
  const avatar = query.avatar === "1" || query.avatar === "true" || cleanPath.includes("/avatar/");
  const isOg = cleanPath.includes("/og/") || cleanPath.endsWith("/og") || /(?:^|\/)og(?:-|\.|$)/i.test(cleanPath);
  const rawW = query.w || query.width;
  const rawH = query.h || query.height;
  const hasExplicitW = Boolean(rawW);
  const hasExplicitH = Boolean(rawH);
  let width = hasExplicitW ? Math.min(Math.max(parseInt(rawW, 10), 1), MAX_DIMENSION) : null;
  let height = hasExplicitH ? Math.min(Math.max(parseInt(rawH, 10), 1), MAX_DIMENSION) : null;
  const rawCw = query.cw || query.cropWidth || query.cropwidth;
  const rawCh = query.ch || query.cropHeight || query.cropheight;
  const cropWidth = rawCw ? Math.min(Math.max(parseInt(rawCw, 10), 1), MAX_DIMENSION) : null;
  const cropHeight = rawCh ? Math.min(Math.max(parseInt(rawCh, 10), 1), MAX_DIMENSION) : null;
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
  if (!fit) fit = hasExplicitW && hasExplicitH ? "fill" : "cover";
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
    fit: VALID_FITS.has(fit) ? fit : "cover",
    position: VALID_POSITIONS.has(query.position) ? query.position : avatar ? "top" : "center"
  };
}
__name(getOptions, "getOptions");
function needsTransform(query, opts) {
  return Boolean(
    opts.width || opts.height || opts.cropWidth || opts.cropHeight || opts.avatar || opts.isOg || query.q || query.quality || query.blur || query.sharpen || query.rotate || query.flip || query.fliph || query.flop || query.flipv || query.grayscale || query.greyscale
  );
}
__name(needsTransform, "needsTransform");

// ../../node_modules/@cf-wasm/photon/dist/lib/photon_rs.js
var PhotonImage = class PhotonImage2 {
  static {
    __name(this, "PhotonImage");
  }
  static __wrap(ptr) {
    const obj = Object.create(PhotonImage2.prototype);
    obj.__wbg_ptr = ptr;
    PhotonImageFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PhotonImageFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_photonimage_free(ptr, 0);
  }
  /**
  * Convert the PhotonImage to base64.
  * @returns {string}
  */
  get_base64() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.photonimage_get_base64(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
  * Convert the PhotonImage to raw bytes. Returns PNG.
  * @returns {Uint8Array}
  */
  get_bytes() {
    const ret = wasm.photonimage_get_bytes(this.__wbg_ptr);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
  }
  /**
  * Convert the PhotonImage to raw bytes. Returns a JPEG.
  * @param {number} quality
  * @returns {Uint8Array}
  */
  get_bytes_jpeg(quality) {
    const ret = wasm.photonimage_get_bytes_jpeg(this.__wbg_ptr, quality);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
  }
  /**
  * Convert the PhotonImage to raw bytes. Returns a WEBP.
  * @returns {Uint8Array}
  */
  get_bytes_webp() {
    const ret = wasm.photonimage_get_bytes_webp(this.__wbg_ptr);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
  }
  /**
  * Calculates estimated filesize and returns number of bytes
  * @returns {bigint}
  */
  get_estimated_filesize() {
    const ret = wasm.photonimage_get_estimated_filesize(this.__wbg_ptr);
    return BigInt.asUintN(64, ret);
  }
  /**
  * Get the height of the PhotonImage.
  * @returns {number}
  */
  get_height() {
    return wasm.photonimage_get_height(this.__wbg_ptr) >>> 0;
  }
  /**
  * Convert the PhotonImage's raw pixels to JS-compatible ImageData.
  * @returns {ImageData}
  */
  get_image_data() {
    return wasm.photonimage_get_image_data(this.__wbg_ptr);
  }
  /**
  * Get the PhotonImage's pixels as a Vec of u8s.
  * @returns {Uint8Array}
  */
  get_raw_pixels() {
    const ret = wasm.photonimage_get_raw_pixels(this.__wbg_ptr);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
  }
  /**
  * Get the width of the PhotonImage.
  * @returns {number}
  */
  get_width() {
    return wasm.photonimage_get_width(this.__wbg_ptr) >>> 0;
  }
  /**
  * Create a new PhotonImage from a Vec of u8s, which represent raw pixels.
  * @param {Uint8Array} raw_pixels
  * @param {number} width
  * @param {number} height
  */
  constructor(raw_pixels, width, height) {
    const ptr0 = passArray8ToWasm0(raw_pixels, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.photonimage_new(ptr0, len0, width, height);
    this.__wbg_ptr = ret;
    PhotonImageFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
  * Create a new PhotonImage from a base64 string.
  * @param {string} base64
  * @returns {PhotonImage}
  */
  static new_from_base64(base64) {
    const ptr0 = passStringToWasm0(base64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.photonimage_new_from_base64(ptr0, len0);
    return PhotonImage2.__wrap(ret);
  }
  /**
  * Create a new PhotonImage from a Blob/File.
  * @param {Blob} blob
  * @returns {PhotonImage}
  */
  static new_from_blob(blob) {
    const ret = wasm.photonimage_new_from_blob(blob);
    return PhotonImage2.__wrap(ret);
  }
  /**
  * Create a new PhotonImage from a byteslice.
  * @param {Uint8Array} vec
  * @returns {PhotonImage}
  */
  static new_from_byteslice(vec) {
    const ptr0 = passArray8ToWasm0(vec, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.photonimage_new_from_byteslice(ptr0, len0);
    return PhotonImage2.__wrap(ret);
  }
  /**
  * Create a new PhotonImage from a HTMLImageElement
  * @param {HTMLImageElement} image
  * @returns {PhotonImage}
  */
  static new_from_image(image) {
    const ret = wasm.photonimage_new_from_image(image);
    return PhotonImage2.__wrap(ret);
  }
  /**
  * Convert ImageData to raw pixels, and update the PhotonImage's raw pixels to this.
  * @param {ImageData} img_data
  */
  set_imgdata(img_data) {
    wasm.photonimage_set_imgdata(this.__wbg_ptr, img_data);
  }
};
if (Symbol.dispose) PhotonImage.prototype[Symbol.dispose] = PhotonImage.prototype.free;
var Rgb = class {
  static {
    __name(this, "Rgb");
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RgbFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_rgb_free(ptr, 0);
  }
  /**
  * Get the Blue value.
  * @returns {number}
  */
  get_blue() {
    return wasm.rgb_get_blue(this.__wbg_ptr);
  }
  /**
  * Get the Green value.
  * @returns {number}
  */
  get_green() {
    return wasm.rgb_get_green(this.__wbg_ptr);
  }
  /**
  * Get the Red value.
  * @returns {number}
  */
  get_red() {
    return wasm.rgb_get_red(this.__wbg_ptr);
  }
  /**
  * Create a new RGB struct.
  * @param {number} r
  * @param {number} g
  * @param {number} b
  */
  constructor(r, g, b) {
    const ret = wasm.rgb_new(r, g, b);
    this.__wbg_ptr = ret;
    RgbFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
  * Set the Blue value.
  * @param {number} b
  */
  set_blue(b) {
    wasm.rgb_set_blue(this.__wbg_ptr, b);
  }
  /**
  * Get the Green value.
  * @param {number} g
  */
  set_green(g) {
    wasm.rgb_set_green(this.__wbg_ptr, g);
  }
  /**
  * Set the Red value.
  * @param {number} r
  */
  set_red(r) {
    wasm.rgb_set_red(this.__wbg_ptr, r);
  }
};
if (Symbol.dispose) Rgb.prototype[Symbol.dispose] = Rgb.prototype.free;
var Rgba = class {
  static {
    __name(this, "Rgba");
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RgbaFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_rgba_free(ptr, 0);
  }
  /**
  * Get the alpha value for this color.
  * @returns {number}
  */
  get_alpha() {
    return wasm.rgba_get_alpha(this.__wbg_ptr);
  }
  /**
  * Get the Blue value.
  * @returns {number}
  */
  get_blue() {
    return wasm.rgba_get_blue(this.__wbg_ptr);
  }
  /**
  * Get the Green value.
  * @returns {number}
  */
  get_green() {
    return wasm.rgba_get_green(this.__wbg_ptr);
  }
  /**
  * Get the Red value.
  * @returns {number}
  */
  get_red() {
    return wasm.rgba_get_red(this.__wbg_ptr);
  }
  /**
  * Create a new RGBA struct.
  * @param {number} r
  * @param {number} g
  * @param {number} b
  * @param {number} a
  */
  constructor(r, g, b, a) {
    const ret = wasm.rgba_new(r, g, b, a);
    this.__wbg_ptr = ret;
    RgbaFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
  * Set the alpha value.
  * @param {number} a
  */
  set_alpha(a) {
    wasm.rgba_set_alpha(this.__wbg_ptr, a);
  }
  /**
  * Set the Blue value.
  * @param {number} b
  */
  set_blue(b) {
    wasm.rgba_set_blue(this.__wbg_ptr, b);
  }
  /**
  * Get the Green value.
  * @param {number} g
  */
  set_green(g) {
    wasm.rgba_set_green(this.__wbg_ptr, g);
  }
  /**
  * Set the Red value.
  * @param {number} r
  */
  set_red(r) {
    wasm.rgba_set_red(this.__wbg_ptr, r);
  }
};
if (Symbol.dispose) Rgba.prototype[Symbol.dispose] = Rgba.prototype.free;
var SamplingFilter = Object.freeze({
  Nearest: 1,
  "1": "Nearest",
  Triangle: 2,
  "2": "Triangle",
  CatmullRom: 3,
  "3": "CatmullRom",
  Gaussian: 4,
  "4": "Gaussian",
  Lanczos3: 5,
  "5": "Lanczos3"
});
function crop(photon_image, x1, y1, x2, y2) {
  _assertClass(photon_image, PhotonImage);
  const ret = wasm.crop(photon_image.__wbg_ptr, x1, y1, x2, y2);
  return PhotonImage.__wrap(ret);
}
__name(crop, "crop");
function fliph(photon_image) {
  _assertClass(photon_image, PhotonImage);
  wasm.fliph(photon_image.__wbg_ptr);
}
__name(fliph, "fliph");
function flipv(photon_image) {
  _assertClass(photon_image, PhotonImage);
  wasm.flipv(photon_image.__wbg_ptr);
}
__name(flipv, "flipv");
function gaussian_blur(photon_image, radius) {
  _assertClass(photon_image, PhotonImage);
  wasm.gaussian_blur(photon_image.__wbg_ptr, radius);
}
__name(gaussian_blur, "gaussian_blur");
function grayscale_human_corrected(img) {
  _assertClass(img, PhotonImage);
  wasm.grayscale_human_corrected(img.__wbg_ptr);
}
__name(grayscale_human_corrected, "grayscale_human_corrected");
function resize(photon_img, width, height, sampling_filter) {
  _assertClass(photon_img, PhotonImage);
  const ret = wasm.resize(photon_img.__wbg_ptr, width, height, sampling_filter);
  return PhotonImage.__wrap(ret);
}
__name(resize, "resize");
function sharpen(photon_image) {
  _assertClass(photon_image, PhotonImage);
  wasm.sharpen(photon_image.__wbg_ptr);
}
__name(sharpen, "sharpen");
function __wbg_get_imports() {
  return {
    __proto__: null,
    "./photon_rs_bg.js": {
      __proto__: null,
      __wbg___wbindgen_debug_string_c25d447a39f5578f: /* @__PURE__ */ __name(function(arg0, arg1) {
        const ptr1 = passStringToWasm0(debugString(arg1), wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4, len1, true);
        getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
      }, "__wbg___wbindgen_debug_string_c25d447a39f5578f"),
      __wbg___wbindgen_is_undefined_c05833b95a3cf397: /* @__PURE__ */ __name(function(arg0) {
        return arg0 === void 0;
      }, "__wbg___wbindgen_is_undefined_c05833b95a3cf397"),
      __wbg___wbindgen_throw_344f42d3211c4765: /* @__PURE__ */ __name(function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
      }, "__wbg___wbindgen_throw_344f42d3211c4765"),
      __wbg_appendChild_f553e8704c4f14a6: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1) {
          return arg0.appendChild(arg1);
        }, arguments);
      }, "__wbg_appendChild_f553e8704c4f14a6"),
      __wbg_body_40ec34e0a2931fe8: /* @__PURE__ */ __name(function(arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_body_40ec34e0a2931fe8"),
      __wbg_createElement_fcbc0805de826d62: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2) {
          return arg0.createElement(getStringFromWasm0(arg1, arg2));
        }, arguments);
      }, "__wbg_createElement_fcbc0805de826d62"),
      __wbg_data_d6abbdd903c05db4: /* @__PURE__ */ __name(function(arg0, arg1) {
        const ret = arg1.data;
        const ptr1 = passArray8ToWasm0(ret, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4, len1, true);
        getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
      }, "__wbg_data_d6abbdd903c05db4"),
      __wbg_document_179650d6cb13c263: /* @__PURE__ */ __name(function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_document_179650d6cb13c263"),
      __wbg_drawImage_62c3057e8df6ed68: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
          arg0.drawImage(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        }, arguments);
      }, "__wbg_drawImage_62c3057e8df6ed68"),
      __wbg_drawImage_b2fac98b4196623d: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
          arg0.drawImage(arg1, arg2, arg3);
        }, arguments);
      }, "__wbg_drawImage_b2fac98b4196623d"),
      __wbg_error_a6fa202b58aa1cd3: /* @__PURE__ */ __name(function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
          deferred0_0 = arg0;
          deferred0_1 = arg1;
          console.error(getStringFromWasm0(arg0, arg1));
        } finally {
          wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
      }, "__wbg_error_a6fa202b58aa1cd3"),
      __wbg_getContext_e79ddf6a9cb3cc76: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2) {
          const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
          return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments);
      }, "__wbg_getContext_e79ddf6a9cb3cc76"),
      __wbg_getImageData_067e54eaa187efb7: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2, arg3, arg4) {
          return arg0.getImageData(arg1, arg2, arg3, arg4);
        }, arguments);
      }, "__wbg_getImageData_067e54eaa187efb7"),
      __wbg_height_1ac64d880e0a71ae: /* @__PURE__ */ __name(function(arg0) {
        return arg0.height;
      }, "__wbg_height_1ac64d880e0a71ae"),
      __wbg_height_46f95580d0507f0a: /* @__PURE__ */ __name(function(arg0) {
        return arg0.height;
      }, "__wbg_height_46f95580d0507f0a"),
      __wbg_height_6eec812c213259a1: /* @__PURE__ */ __name(function(arg0) {
        return arg0.height;
      }, "__wbg_height_6eec812c213259a1"),
      __wbg_instanceof_CanvasRenderingContext2d_2284b703b7023dcc: /* @__PURE__ */ __name(function(arg0) {
        let result;
        try {
          result = arg0 instanceof CanvasRenderingContext2D;
        } catch (_) {
          result = false;
        }
        return result;
      }, "__wbg_instanceof_CanvasRenderingContext2d_2284b703b7023dcc"),
      __wbg_instanceof_HtmlCanvasElement_ed02ed9136056019: /* @__PURE__ */ __name(function(arg0) {
        let result;
        try {
          result = arg0 instanceof HTMLCanvasElement;
        } catch (_) {
          result = false;
        }
        return result;
      }, "__wbg_instanceof_HtmlCanvasElement_ed02ed9136056019"),
      __wbg_instanceof_Window_05ba1ee4f6781663: /* @__PURE__ */ __name(function(arg0) {
        let result;
        try {
          result = arg0 instanceof Window;
        } catch (_) {
          result = false;
        }
        return result;
      }, "__wbg_instanceof_Window_05ba1ee4f6781663"),
      __wbg_length_1f0964f4a5e2c6d8: /* @__PURE__ */ __name(function(arg0) {
        return arg0.length;
      }, "__wbg_length_1f0964f4a5e2c6d8"),
      __wbg_new_227d7c05414eb861: /* @__PURE__ */ __name(function() {
        return /* @__PURE__ */ new Error();
      }, "__wbg_new_227d7c05414eb861"),
      __wbg_new_cd45aabdf6073e84: /* @__PURE__ */ __name(function(arg0) {
        return new Uint8Array(arg0);
      }, "__wbg_new_cd45aabdf6073e84"),
      __wbg_new_with_u8_clamped_array_and_sh_2767e4741c267d25: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
          return new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0);
        }, arguments);
      }, "__wbg_new_with_u8_clamped_array_and_sh_2767e4741c267d25"),
      __wbg_prototypesetcall_4770620bbe4688a0: /* @__PURE__ */ __name(function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
      }, "__wbg_prototypesetcall_4770620bbe4688a0"),
      __wbg_putImageData_a4dee11e08ab9ac8: /* @__PURE__ */ __name(function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
          arg0.putImageData(arg1, arg2, arg3);
        }, arguments);
      }, "__wbg_putImageData_a4dee11e08ab9ac8"),
      __wbg_random_039a7d5d06e0d333: /* @__PURE__ */ __name(function() {
        return Math.random();
      }, "__wbg_random_039a7d5d06e0d333"),
      __wbg_set_height_7d9d8f892e6964c6: /* @__PURE__ */ __name(function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
      }, "__wbg_set_height_7d9d8f892e6964c6"),
      __wbg_set_textContent_54dcad83ae15772d: /* @__PURE__ */ __name(function(arg0, arg1, arg2) {
        arg0.textContent = arg1 === 0 ? void 0 : getStringFromWasm0(arg1, arg2);
      }, "__wbg_set_textContent_54dcad83ae15772d"),
      __wbg_set_width_8e30d010cd66830d: /* @__PURE__ */ __name(function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
      }, "__wbg_set_width_8e30d010cd66830d"),
      __wbg_stack_3b0d974bbf31e44f: /* @__PURE__ */ __name(function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4, len1, true);
        getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
      }, "__wbg_stack_3b0d974bbf31e44f"),
      __wbg_static_accessor_GLOBAL_4ef717fb391d88b7: /* @__PURE__ */ __name(function() {
        const ret = typeof global === "undefined" ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_static_accessor_GLOBAL_4ef717fb391d88b7"),
      __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4: /* @__PURE__ */ __name(function() {
        const ret = typeof globalThis === "undefined" ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4"),
      __wbg_static_accessor_SELF_146583524fe1469b: /* @__PURE__ */ __name(function() {
        const ret = typeof self === "undefined" ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_static_accessor_SELF_146583524fe1469b"),
      __wbg_static_accessor_WINDOW_f2829a2234d7819e: /* @__PURE__ */ __name(function() {
        const ret = typeof window === "undefined" ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, "__wbg_static_accessor_WINDOW_f2829a2234d7819e"),
      __wbg_width_05a6fecf7eca198d: /* @__PURE__ */ __name(function(arg0) {
        return arg0.width;
      }, "__wbg_width_05a6fecf7eca198d"),
      __wbg_width_6d9315ecc7140ff6: /* @__PURE__ */ __name(function(arg0) {
        return arg0.width;
      }, "__wbg_width_6d9315ecc7140ff6"),
      __wbg_width_c1e3781335067e0c: /* @__PURE__ */ __name(function(arg0) {
        return arg0.width;
      }, "__wbg_width_c1e3781335067e0c"),
      __wbindgen_init_externref_table: /* @__PURE__ */ __name(function() {
        const table = wasm.__wbindgen_externrefs;
        const offset2 = table.grow(4);
        table.set(0, void 0);
        table.set(offset2 + 0, void 0);
        table.set(offset2 + 1, null);
        table.set(offset2 + 2, true);
        table.set(offset2 + 3, false);
      }, "__wbindgen_init_externref_table")
    }
  };
}
__name(__wbg_get_imports, "__wbg_get_imports");
var PhotonImageFinalization = typeof FinalizationRegistry === "undefined" ? {
  register: /* @__PURE__ */ __name(() => {
  }, "register"),
  unregister: /* @__PURE__ */ __name(() => {
  }, "unregister")
} : new FinalizationRegistry((ptr) => wasm.__wbg_photonimage_free(ptr, 1));
var RgbFinalization = typeof FinalizationRegistry === "undefined" ? {
  register: /* @__PURE__ */ __name(() => {
  }, "register"),
  unregister: /* @__PURE__ */ __name(() => {
  }, "unregister")
} : new FinalizationRegistry((ptr) => wasm.__wbg_rgb_free(ptr, 1));
var RgbaFinalization = typeof FinalizationRegistry === "undefined" ? {
  register: /* @__PURE__ */ __name(() => {
  }, "register"),
  unregister: /* @__PURE__ */ __name(() => {
  }, "unregister")
} : new FinalizationRegistry((ptr) => wasm.__wbg_rgba_free(ptr, 1));
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}
__name(addToExternrefTable0, "addToExternrefTable0");
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) throw new Error(`expected instance of ${klass.name}`);
}
__name(_assertClass, "_assertClass");
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) return `${val}`;
  if (type == "string") return `"${val}"`;
  if (type == "symbol") {
    const description = val.description;
    if (description == null) return "Symbol";
    else return `Symbol(${description})`;
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) return `Function(${name})`;
    else return "Function";
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) debug += debugString(val[0]);
    for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) className = builtInMatches[1];
  else return toString.call(val);
  if (className == "Object") try {
    return "Object(" + JSON.stringify(val) + ")";
  } catch (_) {
    return "Object";
  }
  if (val instanceof Error) return `${val.name}: ${val.message}
${val.stack}`;
  return className;
}
__name(debugString, "debugString");
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
__name(getArrayU8FromWasm0, "getArrayU8FromWasm0");
function getClampedArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ClampedArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
__name(getClampedArrayU8FromWasm0, "getClampedArrayU8FromWasm0");
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  return cachedDataViewMemory0;
}
__name(getDataViewMemory0, "getDataViewMemory0");
function getStringFromWasm0(ptr, len) {
  return decodeText(ptr >>> 0, len);
}
__name(getStringFromWasm0, "getStringFromWasm0");
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  return cachedUint8ArrayMemory0;
}
__name(getUint8ArrayMemory0, "getUint8ArrayMemory0");
var cachedUint8ClampedArrayMemory0 = null;
function getUint8ClampedArrayMemory0() {
  if (cachedUint8ClampedArrayMemory0 === null || cachedUint8ClampedArrayMemory0.byteLength === 0) cachedUint8ClampedArrayMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
  return cachedUint8ClampedArrayMemory0;
}
__name(getUint8ClampedArrayMemory0, "getUint8ClampedArrayMemory0");
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
__name(handleError, "handleError");
function isLikeNone(x) {
  return x === void 0 || x === null;
}
__name(isLikeNone, "isLikeNone");
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
__name(passArray8ToWasm0, "passArray8ToWasm0");
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset2 = 0;
  for (; offset2 < len; offset2++) {
    const code = arg.charCodeAt(offset2);
    if (code > 127) break;
    mem[ptr + offset2] = code;
  }
  if (offset2 !== len) {
    if (offset2 !== 0) arg = arg.slice(offset2);
    ptr = realloc(ptr, len, len = offset2 + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset2, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);
    offset2 += ret.written;
    ptr = realloc(ptr, len, offset2, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset2;
  return ptr;
}
__name(passStringToWasm0, "passStringToWasm0");
var cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true
});
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
__name(decodeText, "decodeText");
var cachedTextEncoder = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder)) cachedTextEncoder.encodeInto = function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
var WASM_VECTOR_LEN = 0;
var wasm;
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  cachedUint8ClampedArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
__name(__wbg_finalize_init, "__wbg_finalize_init");
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") try {
      return await WebAssembly.instantiateStreaming(module, imports);
    } catch (e) {
      if (module.ok && expectedResponseType(module.type) && module.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
      else throw e;
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) return {
      instance,
      module
    };
    else return instance;
  }
  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
  __name(expectedResponseType, "expectedResponseType");
}
__name(__wbg_load, "__wbg_load");
function initSync(module) {
  if (wasm !== void 0) return wasm;
  if (module !== void 0) if (Object.getPrototypeOf(module) === Object.prototype) ({ module } = module);
  else console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
  const imports = __wbg_get_imports();
  return __wbg_finalize_init(new WebAssembly.Instance(module, imports), module);
}
__name(initSync, "initSync");
async function __wbg_init(module_or_path) {
  if (wasm !== void 0) return wasm;
  if (module_or_path !== void 0) if (Object.getPrototypeOf(module_or_path) === Object.prototype) ({ module_or_path } = module_or_path);
  else console.warn("using deprecated parameters for the initialization function; pass a single object instead");
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) module_or_path = fetch(module_or_path);
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}
__name(__wbg_init, "__wbg_init");

// ../../node_modules/@cf-wasm/internals/dist/polyfills/image-data.js
var globalObject = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : self;
if (!("ImageData" in globalObject)) {
  let getColorSpaceFromImageSettings = function(imageSettings) {
    if (typeof imageSettings !== "undefined") {
      if (typeof imageSettings !== "object") throw new TypeError("Failed to construct 'ImageData': The provided value is not of type 'ImageDataSettings'.");
      if (imageSettings && "colorSpace" in imageSettings && typeof imageSettings.colorSpace !== "undefined") {
        if (typeof imageSettings.colorSpace !== "string" || !colorSpaceEnum.includes(imageSettings.colorSpace)) throw new TypeError(`Failed to construct 'ImageData': Failed to read the 'colorSpace' property from 'ImageDataSettings': The provided value '${imageSettings.colorSpace}' is not a valid enum value of type PredefinedColorSpace.`);
        return imageSettings.colorSpace;
      }
    }
    return "srgb";
  };
  __name(getColorSpaceFromImageSettings, "getColorSpaceFromImageSettings");
  const widthMap = /* @__PURE__ */ new WeakMap();
  const heightMap = /* @__PURE__ */ new WeakMap();
  const colorSpaceMap = /* @__PURE__ */ new WeakMap();
  const colorSpaceEnum = ["display-p3", "srgb"];
  class ImageData3 {
    static {
      __name(this, "ImageData");
    }
    constructor(...args) {
      let imageWidth;
      let imageHeight;
      let imageData;
      let imageColorSpace;
      const [arg1, arg2, arg3, arg4] = args;
      if (args.length < 2) throw new TypeError(`Failed to construct 'ImageData': 2 arguments required, but only ${args.length} present.`);
      if (typeof arg1 === "object") {
        if (!(arg1 instanceof Uint8ClampedArray)) throw new TypeError("Failed to construct 'ImageData': parameter 1 is not of type 'Uint8ClampedArray'.");
        if (typeof arg2 !== "number" || arg2 === 0) throw new Error("Failed to construct 'ImageData': The source width is zero or not a number.");
        imageData = arg1;
        imageWidth = arg2 >>> 0;
        if (imageWidth * 4 > imageData.length) throw new Error("Failed to construct 'ImageData': The requested image size exceeds the supported range.");
        if (imageData.length % 4 !== 0) throw new Error("Failed to construct 'ImageData': The input data length is not a multiple of 4.");
        if (imageData.length % (4 * imageWidth) !== 0) throw new Error("Failed to construct 'ImageData': The input data length is not a multiple of (4 * width).");
        if (typeof arg3 !== "undefined") {
          if (typeof arg3 !== "number" || arg3 === 0) throw new Error("Failed to construct 'ImageData': The source height is zero or not a number.");
          imageHeight = arg3 >>> 0;
          if (imageData.length % (4 * imageWidth * imageHeight) !== 0) throw new Error("Failed to construct 'ImageData': The input data length is not equal to (4 * width * height).");
        } else imageHeight = imageData.byteLength / imageWidth / 4;
        imageColorSpace = getColorSpaceFromImageSettings(arg4);
      } else {
        if (typeof arg1 !== "number" || arg1 === 0) throw new Error("Failed to construct 'ImageData': The source width is zero or not a number.");
        imageWidth = arg1 >>> 0;
        if (typeof arg2 !== "number" || arg2 === 0) throw new Error("Failed to construct 'ImageData': The source height is zero or not a number.");
        imageHeight = arg2 >>> 0;
        if (imageWidth * imageHeight >= 1 << 30) throw new Error("Failed to construct 'ImageData': The requested image size exceeds the supported range.");
        imageData = new Uint8ClampedArray(imageWidth * imageHeight * 4);
        imageColorSpace = getColorSpaceFromImageSettings(arg3);
      }
      widthMap.set(this, imageWidth);
      heightMap.set(this, imageHeight);
      colorSpaceMap.set(this, imageColorSpace);
      Object.defineProperty(this, "data", {
        configurable: true,
        enumerable: true,
        value: imageData,
        writable: false
      });
    }
  }
  Object.defineProperty(ImageData3.prototype, "width", {
    enumerable: true,
    configurable: true,
    get() {
      return widthMap.get(this);
    }
  });
  Object.defineProperty(ImageData3.prototype, "height", {
    enumerable: true,
    configurable: true,
    get() {
      return heightMap.get(this);
    }
  });
  Object.defineProperty(ImageData3.prototype, "colorSpace", {
    enumerable: true,
    configurable: true,
    get() {
      return colorSpaceMap.get(this);
    }
  });
  globalObject.ImageData = ImageData3;
}
var ImageData2 = globalObject.ImageData;

// ../../node_modules/@cf-wasm/photon/dist/photon.js
function initPhoton(input) {
  if (initPhoton.initialized) throw new Error("(@cf-wasm/photon): Function already called. The `initPhoton()` function can be used only once.");
  if (!input) throw new Error("(@cf-wasm/photon): Argument `input` is not valid.");
  initPhoton.initialized = true;
  initPhoton.promise = (async () => {
    const output = await __wbg_init(await input);
    initPhoton.ready = true;
    return output;
  })();
  return initPhoton.promise;
}
__name(initPhoton, "initPhoton");
initPhoton.sync = (input) => {
  if (initPhoton.initialized) throw new Error("(@cf-wasm/photon): Function already called. The `initPhoton()` function can be used only once.");
  if (!input) throw new Error("(@cf-wasm/photon): Argument `input` is not valid.");
  initPhoton.initialized = true;
  const output = initSync(input);
  initPhoton.promise = Promise.resolve(output);
  initPhoton.ready = true;
  return output;
};
initPhoton.promise = null;
initPhoton.initialized = false;
initPhoton.ready = false;
initPhoton.ensure = () => {
  if (!initPhoton.promise) throw new Error("(@cf-wasm/photon): Function not called. Call `initPhoton()` function first.");
  return initPhoton.promise;
};

// ../../node_modules/@cf-wasm/photon/dist/workerd.js
import photonWasmModule from "./a53137fb0ae8aa1649a103b7fb379bc97522c937-photon_rs_bg.wasm";
initPhoton.sync({ module: photonWasmModule });

// ../../node_modules/@resvg/resvg-wasm/index.mjs
var wasm2;
var heap = new Array(128).fill(void 0);
heap.push(void 0, null, true, false);
var heap_next = heap.length;
function addHeapObject(obj) {
  if (heap_next === heap.length)
    heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
__name(addHeapObject, "addHeapObject");
function getObject(idx) {
  return heap[idx];
}
__name(getObject, "getObject");
function dropObject(idx) {
  if (idx < 132)
    return;
  heap[idx] = heap_next;
  heap_next = idx;
}
__name(dropObject, "dropObject");
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
__name(takeObject, "takeObject");
var WASM_VECTOR_LEN2 = 0;
var cachedUint8Memory0 = null;
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm2.memory.buffer);
  }
  return cachedUint8Memory0;
}
__name(getUint8Memory0, "getUint8Memory0");
var cachedTextEncoder2 = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: /* @__PURE__ */ __name(() => {
  throw Error("TextEncoder not available");
}, "encode") };
var encodeString = typeof cachedTextEncoder2.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder2.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder2.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm02(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder2.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN2 = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8Memory0();
  let offset2 = 0;
  for (; offset2 < len; offset2++) {
    const code = arg.charCodeAt(offset2);
    if (code > 127)
      break;
    mem[ptr + offset2] = code;
  }
  if (offset2 !== len) {
    if (offset2 !== 0) {
      arg = arg.slice(offset2);
    }
    ptr = realloc(ptr, len, len = offset2 + arg.length * 3, 1) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset2, ptr + len);
    const ret = encodeString(arg, view);
    offset2 += ret.written;
    ptr = realloc(ptr, len, offset2, 1) >>> 0;
  }
  WASM_VECTOR_LEN2 = offset2;
  return ptr;
}
__name(passStringToWasm02, "passStringToWasm0");
function isLikeNone2(x) {
  return x === void 0 || x === null;
}
__name(isLikeNone2, "isLikeNone");
var cachedInt32Memory0 = null;
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm2.memory.buffer);
  }
  return cachedInt32Memory0;
}
__name(getInt32Memory0, "getInt32Memory0");
var cachedTextDecoder2 = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: /* @__PURE__ */ __name(() => {
  throw Error("TextDecoder not available");
}, "decode") };
if (typeof TextDecoder !== "undefined") {
  cachedTextDecoder2.decode();
}
function getStringFromWasm02(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder2.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
__name(getStringFromWasm02, "getStringFromWasm0");
function _assertClass2(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}
__name(_assertClass2, "_assertClass");
function handleError2(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm2.__wbindgen_exn_store(addHeapObject(e));
  }
}
__name(handleError2, "handleError");
var BBoxFinalization = typeof FinalizationRegistry === "undefined" ? { register: /* @__PURE__ */ __name(() => {
}, "register"), unregister: /* @__PURE__ */ __name(() => {
}, "unregister") } : new FinalizationRegistry((ptr) => wasm2.__wbg_bbox_free(ptr >>> 0));
var BBox = class _BBox {
  static {
    __name(this, "_BBox");
  }
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_BBox.prototype);
    obj.__wbg_ptr = ptr;
    BBoxFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    BBoxFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm2.__wbg_bbox_free(ptr);
  }
  /**
  * @returns {number}
  */
  get x() {
    const ret = wasm2.__wbg_get_bbox_x(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set x(arg0) {
    wasm2.__wbg_set_bbox_x(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get y() {
    const ret = wasm2.__wbg_get_bbox_y(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set y(arg0) {
    wasm2.__wbg_set_bbox_y(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get width() {
    const ret = wasm2.__wbg_get_bbox_width(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set width(arg0) {
    wasm2.__wbg_set_bbox_width(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get height() {
    const ret = wasm2.__wbg_get_bbox_height(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set height(arg0) {
    wasm2.__wbg_set_bbox_height(this.__wbg_ptr, arg0);
  }
};
var RenderedImageFinalization = typeof FinalizationRegistry === "undefined" ? { register: /* @__PURE__ */ __name(() => {
}, "register"), unregister: /* @__PURE__ */ __name(() => {
}, "unregister") } : new FinalizationRegistry((ptr) => wasm2.__wbg_renderedimage_free(ptr >>> 0));
var RenderedImage = class _RenderedImage {
  static {
    __name(this, "_RenderedImage");
  }
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_RenderedImage.prototype);
    obj.__wbg_ptr = ptr;
    RenderedImageFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RenderedImageFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm2.__wbg_renderedimage_free(ptr);
  }
  /**
  * Get the PNG width
  * @returns {number}
  */
  get width() {
    const ret = wasm2.renderedimage_width(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
  * Get the PNG height
  * @returns {number}
  */
  get height() {
    const ret = wasm2.renderedimage_height(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
  * Write the image data to Uint8Array
  * @returns {Uint8Array}
  */
  asPng() {
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      wasm2.renderedimage_asPng(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Get the RGBA pixels of the image
  * @returns {Uint8Array}
  */
  get pixels() {
    const ret = wasm2.renderedimage_pixels(this.__wbg_ptr);
    return takeObject(ret);
  }
};
var ResvgFinalization = typeof FinalizationRegistry === "undefined" ? { register: /* @__PURE__ */ __name(() => {
}, "register"), unregister: /* @__PURE__ */ __name(() => {
}, "unregister") } : new FinalizationRegistry((ptr) => wasm2.__wbg_resvg_free(ptr >>> 0));
var Resvg = class {
  static {
    __name(this, "Resvg");
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ResvgFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm2.__wbg_resvg_free(ptr);
  }
  /**
  * @param {Uint8Array | string} svg
  * @param {string | undefined} [options]
  * @param {Array<any> | undefined} [custom_font_buffers]
  */
  constructor(svg, options, custom_font_buffers) {
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = isLikeNone2(options) ? 0 : passStringToWasm02(options, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
      var len0 = WASM_VECTOR_LEN2;
      wasm2.resvg_new(retptr, addHeapObject(svg), ptr0, len0, isLikeNone2(custom_font_buffers) ? 0 : addHeapObject(custom_font_buffers));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      this.__wbg_ptr = r0 >>> 0;
      return this;
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Get the SVG width
  * @returns {number}
  */
  get width() {
    const ret = wasm2.resvg_width(this.__wbg_ptr);
    return ret;
  }
  /**
  * Get the SVG height
  * @returns {number}
  */
  get height() {
    const ret = wasm2.resvg_height(this.__wbg_ptr);
    return ret;
  }
  /**
  * Renders an SVG in Wasm
  * @returns {RenderedImage}
  */
  render() {
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      wasm2.resvg_render(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RenderedImage.__wrap(r0);
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Output usvg-simplified SVG string
  * @returns {string}
  */
  toString() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      wasm2.resvg_toString(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm02(r0, r1);
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
      wasm2.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
  * Calculate a maximum bounding box of all visible elements in this SVG.
  *
  * Note: path bounding box are approx values.
  * @returns {BBox | undefined}
  */
  innerBBox() {
    const ret = wasm2.resvg_innerBBox(this.__wbg_ptr);
    return ret === 0 ? void 0 : BBox.__wrap(ret);
  }
  /**
  * Calculate a maximum bounding box of all visible elements in this SVG.
  * This will first apply transform.
  * Similar to `SVGGraphicsElement.getBBox()` DOM API.
  * @returns {BBox | undefined}
  */
  getBBox() {
    const ret = wasm2.resvg_getBBox(this.__wbg_ptr);
    return ret === 0 ? void 0 : BBox.__wrap(ret);
  }
  /**
  * Use a given `BBox` to crop the svg. Currently this method simply changes
  * the viewbox/size of the svg and do not move the elements for simplicity
  * @param {BBox} bbox
  */
  cropByBBox(bbox) {
    _assertClass2(bbox, BBox);
    wasm2.resvg_cropByBBox(this.__wbg_ptr, bbox.__wbg_ptr);
  }
  /**
  * @returns {Array<any>}
  */
  imagesToResolve() {
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      wasm2.resvg_imagesToResolve(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {string} href
  * @param {Uint8Array} buffer
  */
  resolveImage(href, buffer) {
    try {
      const retptr = wasm2.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm02(href, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN2;
      wasm2.resvg_resolveImage(retptr, this.__wbg_ptr, ptr0, len0, addHeapObject(buffer));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      if (r1) {
        throw takeObject(r0);
      }
    } finally {
      wasm2.__wbindgen_add_to_stack_pointer(16);
    }
  }
};
async function __wbg_load2(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get("Content-Type") != "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}
__name(__wbg_load2, "__wbg_load");
function __wbg_get_imports2() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbg_new_28c511d9baebfa89 = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm02(arg0, arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_memory = function() {
    const ret = wasm2.memory;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_buffer_12d079cc21e14bdb = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_newwithbyteoffsetandlength_aa4a17c33a06e5cb = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
  };
  imports.wbg.__wbg_new_63b92bc8671ed464 = function(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_values_839f3396d5aac002 = function(arg0) {
    const ret = getObject(arg0).values();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_next_196c84450b364254 = function() {
    return handleError2(function(arg0) {
      const ret = getObject(arg0).next();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_done_298b57d23c0fc80c = function(arg0) {
    const ret = getObject(arg0).done;
    return ret;
  };
  imports.wbg.__wbg_value_d93c65011f51a456 = function(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_instanceof_Uint8Array_2b3bbecd033d19f6 = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof obj === "string" ? obj : void 0;
    var ptr1 = isLikeNone2(ret) ? 0 : passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN2;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_new_16b304a2cfa7ff4a = function() {
    const ret = new Array();
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm02(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_push_a5b05aedc7234f9f = function(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
  };
  imports.wbg.__wbg_length_c20a40f15020d68a = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
  };
  imports.wbg.__wbg_set_a47bac70306a19a7 = function(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
  };
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm02(arg0, arg1));
  };
  return imports;
}
__name(__wbg_get_imports2, "__wbg_get_imports");
function __wbg_init_memory(imports, maybe_memory) {
}
__name(__wbg_init_memory, "__wbg_init_memory");
function __wbg_finalize_init2(instance, module) {
  wasm2 = instance.exports;
  __wbg_init2.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = null;
  cachedUint8Memory0 = null;
  return wasm2;
}
__name(__wbg_finalize_init2, "__wbg_finalize_init");
async function __wbg_init2(input) {
  if (wasm2 !== void 0)
    return wasm2;
  if (typeof input === "undefined") {
    input = new URL("index_bg.wasm", void 0);
  }
  const imports = __wbg_get_imports2();
  if (typeof input === "string" || typeof Request === "function" && input instanceof Request || typeof URL === "function" && input instanceof URL) {
    input = fetch(input);
  }
  __wbg_init_memory(imports);
  const { instance, module } = await __wbg_load2(await input, imports);
  return __wbg_finalize_init2(instance, module);
}
__name(__wbg_init2, "__wbg_init");
var dist_default = __wbg_init2;
var initialized = false;
var initWasm = /* @__PURE__ */ __name(async (module_or_path) => {
  if (initialized) {
    throw new Error("Already initialized. The `initWasm()` function can be used only once.");
  }
  await dist_default(await module_or_path);
  initialized = true;
}, "initWasm");
var Resvg2 = class extends Resvg {
  static {
    __name(this, "Resvg2");
  }
  /**
   * @param {Uint8Array | string} svg
   * @param {ResvgRenderOptions | undefined} options
   */
  constructor(svg, options) {
    if (!initialized)
      throw new Error("Wasm has not been initialized. Call `initWasm()` function.");
    const font = options?.font;
    if (!!font && isCustomFontsOptions(font)) {
      const serializableOptions = {
        ...options,
        font: {
          ...font,
          fontBuffers: void 0
        }
      };
      super(svg, JSON.stringify(serializableOptions), font.fontBuffers);
    } else {
      super(svg, JSON.stringify(options));
    }
  }
};
function isCustomFontsOptions(value) {
  return Object.prototype.hasOwnProperty.call(value, "fontBuffers");
}
__name(isCustomFontsOptions, "isCustomFontsOptions");

// ../../node_modules/@cf-wasm/resvg/dist/resvg.js
function initResvg(input) {
  if (initResvg.initialized) throw new Error("(@cf-wasm/resvg): Function already called. The `initResvg()` function can be used only once.");
  if (!input) throw new Error("(@cf-wasm/resvg): Argument `input` is not valid.");
  initResvg.initialized = true;
  initResvg.promise = (async () => {
    await initWasm(await input);
    initResvg.ready = true;
  })();
  return initResvg.promise;
}
__name(initResvg, "initResvg");
initResvg.promise = null;
initResvg.initialized = false;
initResvg.ready = false;
initResvg.ensure = () => {
  if (!initResvg.promise) throw new Error("(@cf-wasm/resvg): Function not called. Call `initResvg()` function first.");
  return initResvg.promise;
};
var Resvg3 = class Resvg4 extends Resvg2 {
  static {
    __name(this, "Resvg");
  }
  constructor(svg, options) {
    if (!initResvg.ready) {
      if (initResvg.initialized) throw new Error("(@cf-wasm/resvg): Resvg is not yet ready while `initResvg()` function was called. Use `Resvg.async()` async static method instead to ensure Resvg is ready.");
      throw new Error("(@cf-wasm/resvg): Resvg is not yet initialized. Call `initResvg()` function first.");
    }
    super(svg, options);
  }
  static async async(svg, options) {
    await initResvg.ensure();
    return new Resvg4(svg, options);
  }
  /**
  * @deprecated Use {@link Resvg.async} instead
  */
  static async create(svg, options) {
    return Resvg4.async(svg, options);
  }
};

// ../../node_modules/@cf-wasm/resvg/dist/workerd.js
import resvgWasmModule from "./dd4dd8881e2df4e64203b5c0ae65e1648ab55207-resvg.wasm";
initResvg(resvgWasmModule);

// ../processor.ts
async function fetchSource(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "imagengine/1.0" }
  });
  if (!response.ok) {
    const err = new Error(`Upstream not found (${response.status})`);
    err.status = response.status;
    throw err;
  }
  const type = (response.headers.get("content-type") || "").toLowerCase();
  const isSvg = type.includes("svg") || url.includes(".svg");
  if (isSvg) return { type, svg: await response.text(), raster: null };
  return { type, svg: "", raster: new Uint8Array(await response.arrayBuffer()) };
}
__name(fetchSource, "fetchSource");
function cleanSvg(svg) {
  return svg.replace(/&[a-zA-Z0-9#]*…/g, "\u2026").replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)/g, "&amp;");
}
__name(cleanSvg, "cleanSvg");
async function rasterizeSvg(svgText, targetWidth) {
  const resvg = new Resvg3(cleanSvg(svgText), {
    fitTo: { mode: "width", value: targetWidth },
    background: "rgba(255,255,255,0)",
    font: { loadSystemFonts: false }
  });
  return resvg.render().asPng();
}
__name(rasterizeSvg, "rasterizeSvg");
function cropOffset(d, t, p) {
  if (p === "top" || p === "left") return 0;
  if (p === "bottom" || p === "right") return Math.max(0, d - t);
  return Math.max(0, Math.floor((d - t) / 2));
}
__name(cropOffset, "cropOffset");
function executeResize(img, tw, th, fit, pos, toFree) {
  const sw = img.get_width();
  const sh = img.get_height();
  const sr = sw / sh;
  const tr = tw / th;
  if (fit === "fill") {
    const old = img;
    const res = resize(img, tw, th, SamplingFilter.Lanczos3);
    toFree.push(old);
    return res;
  }
  if (fit === "contain") {
    let rw;
    let rh;
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
  if (fit === "inside") {
    const s = Math.min(tw / sw, th / sh, 1);
    const rw = Math.max(1, Math.round(sw * s));
    const rh = Math.max(1, Math.round(sh * s));
    const old = img;
    const res = resize(img, rw, rh, SamplingFilter.Lanczos3);
    toFree.push(old);
    return res;
  }
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
__name(executeResize, "executeResize");
function safeCrop(img, x, y, w, h) {
  const sw = img.get_width();
  const sh = img.get_height();
  const x1 = Math.max(0, Math.min(x, sw - 1));
  const y1 = Math.max(0, Math.min(y, sh - 1));
  const x2 = Math.min(sw, Math.max(x1 + 1, x1 + w));
  const y2 = Math.min(sh, Math.max(y1 + 1, y1 + h));
  return crop(img, x1, y1, x2, y2);
}
__name(safeCrop, "safeCrop");
function rotateLossless(image, degrees) {
  const norm = (Math.round(degrees) % 360 + 360) % 360;
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
__name(rotateLossless, "rotateLossless");
function encodeImage(img, ext, q) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return { buffer: img.get_bytes_jpeg(q), type: MIME.jpg, actualExt: "jpg" };
    case "png":
      return { buffer: img.get_bytes(), type: MIME.png, actualExt: "png" };
    case "webp":
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: "webp" };
    case "avif":
    case "gif":
    default:
      return { buffer: img.get_bytes_webp(), type: MIME.webp, actualExt: "webp" };
  }
}
__name(encodeImage, "encodeImage");
async function transform(source, query, opts, targetExt) {
  const ext = normalizeExt(targetExt);
  if (source.svg) {
    if (!source.svg.includes("<svg")) {
      const e = new Error("Invalid SVG");
      e.status = 404;
      throw e;
    }
    if (source.svg.length > SVG_MAX_SIZE) {
      const e = new Error("SVG too large");
      e.status = 413;
      throw e;
    }
    const png = await rasterizeSvg(source.svg, opts.width || DEFAULT_SVG_WIDTH);
    const more = opts.height || opts.cropWidth || opts.cropHeight || query.blur || query.sharpen || ext !== "png";
    if (!more) return { buffer: png, type: MIME.png, engine: "resvg-svg", actualExt: "png" };
    return transformRaster(png, query, opts, ext, "resvg-svg");
  }
  if (!source.raster) {
    const e = new Error("No raster data");
    e.status = 404;
    throw e;
  }
  if (source.raster.byteLength > RASTER_MAX_SIZE) {
    const e = new Error("Raster too large");
    e.status = 413;
    throw e;
  }
  return transformRaster(source.raster, query, opts, ext, "photon-raster");
}
__name(transform, "transform");
async function transformRaster(input, query, opts, ext, engine) {
  let image = PhotonImage.new_from_byteslice(input);
  const toFree = [];
  let sw = image.get_width();
  let sh = image.get_height();
  if (sw * sh > 36e6) {
    image.free();
    const e = new Error(`Image resolution too large (${sw}x${sh}). Maximum supported is 36 megapixels.`);
    e.status = 413;
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
  const maxAllowedW = Math.min(sw * MAX_UPSCALE_FACTOR, MAX_DIMENSION);
  const maxAllowedH = Math.min(sh * MAX_UPSCALE_FACTOR, MAX_DIMENSION);
  const targetW = opts.width ? Math.min(opts.width, maxAllowedW) : null;
  const targetH = opts.height ? Math.min(opts.height, maxAllowedH) : null;
  if (targetW && targetH) {
    image = executeResize(image, targetW, targetH, opts.fit, opts.position, toFree);
  } else if (targetW || targetH) {
    let rw;
    let rh;
    if (targetW) {
      rw = targetW;
      rh = Math.max(1, Math.round(sh * (targetW / sw)));
    } else {
      rh = targetH;
      rw = Math.max(1, Math.round(sw * (targetH / sh)));
    }
    const old = image;
    image = resize(image, rw, rh, SamplingFilter.Lanczos3);
    toFree.push(old);
  }
  if (query.blur) {
    const radius = Math.min(Math.max(parseFloat(query.blur), 1), 100);
    gaussian_blur(image, Math.round(radius));
  }
  if (query.sharpen === "true" || query.sharpen === "1") {
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
  if (query.flip === "h" || query.flip === "true" || query.flip === "1" || query.fliph === "1" || query.fliph === "true") {
    fliph(image);
  }
  if (query.flip === "v" || query.flop === "true" || query.flop === "1" || query.flipv === "1" || query.flipv === "true") {
    flipv(image);
  }
  if (query.grayscale === "true" || query.grayscale === "1" || query.greyscale === "true" || query.greyscale === "1") {
    grayscale_human_corrected(image);
  }
  const enc = encodeImage(image, ext, opts.quality);
  for (const i of toFree) {
    try {
      i.free();
    } catch {
    }
  }
  try {
    image.free();
  } catch {
  }
  return { buffer: enc.buffer, type: enc.type, engine, actualExt: enc.actualExt };
}
__name(transformRaster, "transformRaster");

// ../response.ts
async function computeEtag(body) {
  const hash = await crypto.subtle.digest("SHA-256", body);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hex.substring(0, 32)}"`;
}
__name(computeEtag, "computeEtag");
function imageResponse(body, opts) {
  const headers = new Headers();
  headers.set("Content-Type", opts.type);
  headers.set("Content-Length", body.byteLength.toString());
  headers.set("Content-Disposition", `inline; filename="${opts.filename}"`);
  headers.set("Cache-Control", CACHE_HEADER);
  headers.set("CDN-Cache-Control", CDN_CACHE_HEADER);
  headers.set("Cloudflare-CDN-Cache-Control", CDN_CACHE_HEADER);
  headers.set("X-Render-Engine", opts.engine);
  headers.set("X-Origin-Host", opts.host);
  if (opts.etag) headers.set("ETag", opts.etag);
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) {
      headers.set(k, v);
    }
  }
  return new Response(body, { status: 200, headers });
}
__name(imageResponse, "imageResponse");
function notModifiedResponse(etag) {
  return new Response(null, { status: 304, headers: { ETag: etag } });
}
__name(notModifiedResponse, "notModifiedResponse");
function errorResponse(status, message) {
  const isNotFound = status === 404;
  const headers = new Headers();
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (isNotFound) {
    const notFoundCache = "public, max-age=300, s-maxage=300";
    headers.set("Cache-Control", notFoundCache);
    headers.set("CDN-Cache-Control", notFoundCache);
    headers.set("Cloudflare-CDN-Cache-Control", notFoundCache);
  } else {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }
  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers
  });
}
__name(errorResponse, "errorResponse");

// ../index.ts
var app = new Hono3();
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, If-None-Match");
  c.header("Access-Control-Expose-Headers", "ETag, Cache-Control, X-Render-Engine, X-Origin-Host, X-Format-Fallback");
  if (c.req.method === "OPTIONS") return c.body(null, 200);
  await next();
});
app.all("*", async (c) => {
  const url = new URL(c.req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const cleanPath = url.pathname.replace(/^\/+|\/+$/g, "");
  if (cleanPath === "favicon.ico") return c.body(null, 204);
  if (!cleanPath) {
    if (c.env?.ASSETS) {
      return c.env.ASSETS.fetch(c.req.raw);
    }
    return c.json(
      { status: "ok", service: "imagengine" },
      200,
      {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    );
  }
  if (cleanPath === "api" || cleanPath === "health") {
    return c.json(
      { status: "ok", service: "imagengine" },
      200,
      {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    );
  }
  function sendResponse(res) {
    if (cache && c.executionCtx) {
      if (res.status === 200 || res.status === 404) {
        try {
          c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()));
        } catch {
        }
      }
    }
    return res;
  }
  __name(sendResponse, "sendResponse");
  const route = resolveUpstream(cleanPath, query);
  if (!route) {
    return sendResponse(
      errorResponse(404, "Route not found. Required: /[subdomain.]identifier/{path}-{origExt}.{targetExt}")
    );
  }
  const cacheKey = new Request(url.toString(), { method: "GET" });
  let cache = null;
  try {
    cache = caches.default;
  } catch {
  }
  if (cache) {
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const ifNoneMatch2 = c.req.header("If-None-Match");
        const cachedEtag = cachedResponse.headers.get("ETag");
        if (ifNoneMatch2 && cachedEtag && ifNoneMatch2 === cachedEtag) {
          return notModifiedResponse(cachedEtag);
        }
        return cachedResponse;
      }
    } catch {
    }
  }
  const { originUrl, originHost, withoutExt, origExt, requestedExt: routeExt } = route;
  const requestedExt = normalizeExt(query.format || routeExt || "webp");
  let source;
  try {
    source = await fetchSource(originUrl);
  } catch (err) {
    const e = err;
    const status = e.status || 502;
    const msg = e.status === 404 ? "Upstream image not found" : `Upstream error: ${e.message}`;
    return sendResponse(errorResponse(status, msg));
  }
  if (!source.svg && !source.raster) {
    return sendResponse(errorResponse(404, "Upstream asset empty"));
  }
  const opts = getOptions(query, cleanPath);
  const transformed = needsTransform(query, opts);
  const sameExt = origExt === requestedExt;
  const webpSource = source.type.includes("webp") || origExt === "webp";
  const ifNoneMatch = c.req.header("If-None-Match");
  if (!transformed && source.svg && requestedExt === "svg") {
    const body = new TextEncoder().encode(source.svg);
    const etag = await computeEtag(body);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);
    return sendResponse(
      imageResponse(body, {
        type: MIME.svg,
        filename: `${basename(withoutExt)}.svg`,
        host: originHost,
        engine: "edge-passthrough",
        etag
      })
    );
  }
  if (!transformed && source.raster && (sameExt || requestedExt === "webp" && webpSource)) {
    const body = source.raster;
    const etag = await computeEtag(body);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);
    return sendResponse(
      imageResponse(body, {
        type: MIME[requestedExt] || source.type || "application/octet-stream",
        filename: `${basename(withoutExt)}.${requestedExt}`,
        host: originHost,
        engine: "edge-passthrough",
        etag
      })
    );
  }
  try {
    const result = await transform(source, query, opts, requestedExt);
    const etag = await computeEtag(result.buffer);
    if (ifNoneMatch === etag) return notModifiedResponse(etag);
    const extraHeaders = {};
    if (result.actualExt !== requestedExt) {
      extraHeaders["X-Format-Fallback"] = `${requestedExt}\u2192${result.actualExt}`;
    }
    return sendResponse(
      imageResponse(result.buffer, {
        type: result.type,
        filename: `${basename(withoutExt) || "asset"}.${result.actualExt}`,
        host: originHost,
        engine: result.engine,
        etag,
        extraHeaders
      })
    );
  } catch (err) {
    const e = err;
    return errorResponse(e.status || 500, e.message || "Processing failed");
  }
});
var src_default = app;

// [[path]].ts
var onRequest = handle(src_default);

// ../../.wrangler/tmp/pages-dhMnjx/functionsRoutes-0.3211469691862251.mjs
var routes = [
  {
    routePath: "/:path*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match2(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match2, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
/*! Bundled license information:

@cf-wasm/photon/dist/lib/photon_rs.js:
  (*! Needed to remove these lines in order to make it work on next.js *)
  (*! Needed to remove these lines in order to make it work on node.js *)
*/
