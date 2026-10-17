/**
 * Local two-origin server for the REPL spike.
 *
 *   App      http://localhost:5180   shell, worker, compiler
 *   Sandbox  http://127.0.0.1:5181   preview document + package artifacts
 *
 * Different hosts are different sites, so the preview is cross-site like in
 * production. Set REPL_IMMUTABLE=1 to serve artifacts with immutable caching
 * (realistic perf runs); by default `@local` artifacts revalidate so rebuilds show up.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const APP_PORT = Number(process.env.REPL_APP_PORT ?? 5180);
const SANDBOX_PORT = Number(process.env.REPL_SANDBOX_PORT ?? 5181);
const APP_ORIGIN = `http://localhost:${APP_PORT}`;
const SANDBOX_ORIGIN = `http://127.0.0.1:${SANDBOX_PORT}`;
const IMMUTABLE = process.env.REPL_IMMUTABLE === "1";
const DIST = resolve(import.meta.dir, "dist");
const FONT_ORIGIN = "https://1.www.s81c.com";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svelte": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// Optional network shaping for perf runs: fixed per-request latency plus one
// shared FIFO bottleneck link (parallel responses share bandwidth).
const LATENCY_MS = Number(process.env.REPL_LATENCY_MS ?? 0);
const KBPS = Number(process.env.REPL_KBPS ?? 0);
let linkBusyUntil = 0;

async function shaped(response: Response) {
  if (!LATENCY_MS && !KBPS) return response;
  const body = response.body
    ? new Uint8Array(await response.arrayBuffer())
    : null;
  const now = performance.now();
  const start = Math.max(now + LATENCY_MS, linkBusyUntil);
  const transfer = KBPS && body ? (body.length * 8) / KBPS : 0;
  linkBusyUntil = start + transfer;
  await Bun.sleep(linkBusyUntil - now);
  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}

const COMPRESSIBLE_TYPE = /text|json|javascript|svg/;
const WARM_EXTENSIONS = /\.(js|css|json)$/;

const compressed = new Map<
  string,
  { mtime: number; br?: Uint8Array; gz?: Uint8Array }
>();

function compress(
  key: string,
  mtime: number,
  body: Uint8Array,
  encoding: "br" | "gz",
) {
  let entry = compressed.get(key);
  if (!entry || entry.mtime !== mtime) {
    entry = { mtime };
    compressed.set(key, entry);
  }
  entry[encoding] ??=
    encoding === "br"
      ? brotliCompressSync(body, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
        })
      : gzipSync(body, { level: 9 });
  return entry[encoding] as Uint8Array;
}

function respond(
  req: Request,
  body: Uint8Array | string,
  type: string,
  headers: Record<string, string>,
  cacheKey?: { key: string; mtime: number },
) {
  const bytes =
    typeof body === "string" ? new TextEncoder().encode(body) : body;
  const etag = `"${createHash("sha1").update(bytes).digest("base64url")}"`;
  const h = new Headers({
    "Content-Type": type,
    ETag: etag,
    Vary: "Accept-Encoding",
    ...headers,
  });
  if (req.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers: h });
  const accept = req.headers.get("accept-encoding") ?? "";
  const compressible = bytes.length > 1024 && COMPRESSIBLE_TYPE.test(type);
  if (compressible && cacheKey) {
    const encoding = accept.includes("br")
      ? "br"
      : accept.includes("gzip")
        ? "gz"
        : undefined;
    if (encoding) {
      h.set("Content-Encoding", encoding === "br" ? "br" : "gzip");
      return new Response(
        compress(cacheKey.key, cacheKey.mtime, bytes, encoding),
        { headers: h },
      );
    }
  }
  return new Response(bytes, { headers: h });
}

/** Resolve a URL path inside `root`, refusing traversal. */
function fileIn(root: string, path: string) {
  const file = normalize(join(root, decodeURIComponent(path)));
  if (!file.startsWith(root)) return undefined;
  if (existsSync(file) && statSync(file).isDirectory())
    return existsSync(join(file, "index.html"))
      ? join(file, "index.html")
      : undefined;
  return existsSync(file) ? file : undefined;
}

function serveFile(
  req: Request,
  file: string,
  headers: Record<string, string>,
  transform?: (s: string) => string,
) {
  const mtime = statSync(file).mtimeMs;
  const raw = readFileSync(file);
  const body = transform ? transform(raw.toString("utf8")) : raw;
  return respond(
    req,
    body,
    TYPES[extname(file)] ?? "application/octet-stream",
    headers,
    { key: file, mtime },
  );
}

/**
 * A CDN would serve precompressed files. Warm the brotli cache for large files
 * at startup so the first load isn't measuring on-the-fly q11 compression.
 */
function warmCompression() {
  const started = performance.now();
  const large: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.size > 32 * 1024 && WARM_EXTENSIONS.test(name)) large.push(p);
    }
  };
  walk(DIST);
  for (const file of large)
    compress(file, statSync(file).mtimeMs, readFileSync(file), "br");
  console.log(
    `warmed brotli for ${large.length} files in ${Math.round(performance.now() - started)} ms`,
  );
}

warmCompression();

const revalidate = { "Cache-Control": "no-cache" };
const immutable = { "Cache-Control": "public, max-age=31536000, immutable" };

// ---------------------------------------------------------------------------
// App origin

function inlineScriptHashes(html: string) {
  return [
    ...html.matchAll(
      /<script(?![^>]*\bsrc=)(?![^>]*type="importmap")[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map(
    (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`,
  );
}

function appHtml() {
  const manifestDir = join(DIST, "pkg");
  const svelte = readdirVersion(manifestDir, "svelte@");
  const icons = readdirVersion(manifestDir, "icons@");
  const defaults = JSON.stringify({ ccs: "local", svelte, icons });
  const html = readFileSync(join(DIST, "app/index.html"), "utf8")
    .replace("__SANDBOX_ORIGIN__", SANDBOX_ORIGIN)
    .replace("__REPL_DEFAULTS__", defaults.replace(/"/g, "&quot;"))
    .replace("__COMPILER_URL__", `/compiler/svelte@${svelte}.js`);
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes(html).join(" ")}`,
    "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `font-src 'self' data: ${FONT_ORIGIN}`,
    "img-src 'self' data: blob:",
    `connect-src 'self' ${SANDBOX_ORIGIN}`,
    `frame-src ${SANDBOX_ORIGIN}`,
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");
  return { html, csp };
}

function readdirVersion(dir: string, prefix: string) {
  const match = readdirSync(dir).find((d) => d.startsWith(prefix));
  if (!match)
    throw new Error(
      `No ${prefix}* artifacts in ${dir}. Run \`bun run build:artifacts\`.`,
    );
  return match.slice(prefix.length);
}

Bun.serve({
  hostname: "localhost",
  port: APP_PORT,
  fetch: (req) => shaped(appFetch(req)),
});

function appFetch(req: Request) {
  const { pathname } = new URL(req.url);
  if (pathname === "/" || pathname === "/index.html") {
    const { html, csp } = appHtml();
    return respond(
      req,
      html,
      TYPES[".html"],
      { ...revalidate, "Content-Security-Policy": csp },
      {
        key: "app.html",
        mtime: statSync(join(DIST, "app/index.html")).mtimeMs,
      },
    );
  }
  if (pathname.startsWith("/compiler/")) {
    const file = fileIn(
      join(DIST, "compiler"),
      pathname.slice("/compiler/".length),
    );
    if (file) return serveFile(req, file, immutable);
  }
  const file = fileIn(join(DIST, "app"), pathname);
  if (file)
    return serveFile(
      req,
      file,
      pathname.startsWith("/assets/") ? immutable : revalidate,
    );
  return new Response("Not found", { status: 404 });
}

// ---------------------------------------------------------------------------
// Sandbox origin (preview document + artifacts). Opaque-origin documents send
// `Origin: null`, so artifacts are served with `Access-Control-Allow-Origin: *`.

function sandboxCsp(dir: string) {
  const { scriptHashes } = JSON.parse(
    readFileSync(join(dir, "csp.json"), "utf8"),
  );
  return [
    "sandbox allow-scripts allow-modals allow-forms",
    "default-src 'none'",
    `script-src ${SANDBOX_ORIGIN} blob: ${scriptHashes.map((h: string) => `'${h}'`).join(" ")}`,
    `style-src ${SANDBOX_ORIGIN} 'unsafe-inline'`,
    `font-src ${SANDBOX_ORIGIN} data: ${FONT_ORIGIN}`,
    "img-src * data: blob:",
    "media-src * data: blob:",
    "connect-src *",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");
}

Bun.serve({
  hostname: "127.0.0.1",
  port: SANDBOX_PORT,
  fetch: (req) => shaped(sandboxFetch(req)),
});

function sandboxFetch(req: Request) {
  const { pathname } = new URL(req.url);
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
  if (pathname.startsWith("/sandbox/")) {
    const file = fileIn(
      join(DIST, "sandbox"),
      pathname.slice("/sandbox/".length),
    );
    if (file?.endsWith("index.html")) {
      return serveFile(req, file, {
        ...cors,
        ...revalidate,
        "Content-Security-Policy": sandboxCsp(join(file, "..")),
      });
    }
    if (file) return serveFile(req, file, { ...cors, ...revalidate });
  }
  if (pathname.startsWith("/pkg/")) {
    const file = fileIn(join(DIST, "pkg"), pathname.slice("/pkg/".length));
    if (file) {
      const versioned = IMMUTABLE || !pathname.includes("@local");
      return serveFile(req, file, {
        ...cors,
        ...(versioned ? immutable : revalidate),
      });
    }
  }
  return new Response("Not found", { status: 404, headers: cors });
}

console.log(`Carbon REPL spike
  app      ${APP_ORIGIN}
  sandbox  ${SANDBOX_ORIGIN}${IMMUTABLE ? "  (immutable caching)" : ""}${LATENCY_MS || KBPS ? `\n  shaping  ${LATENCY_MS} ms latency, ${KBPS} kbit/s` : ""}`);
