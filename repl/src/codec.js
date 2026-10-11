// URL fragment codec (experimental "x" prefix; the v1 format is not frozen yet).
// Payload: { f: [[name, source], …], v: { ccs, svelte, icons }, o: { theme } }
// → JSON → deflate-raw (CompressionStream) → base64url.

const PLUS = /\+/g;
const SLASH = /\//g;
const PADDING = /=+$/;

function toBase64Url(bytes) {
  if (bytes.toBase64)
    return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(PLUS, "-")
    .replace(SLASH, "_")
    .replace(PADDING, "");
}

export async function encodeHash(prefix, { files, versions, options }) {
  const json = JSON.stringify({
    f: files.map((f) => [f.name, f.source]),
    v: versions,
    o: options,
  });
  const stream = new Blob([json])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return prefix + toBase64Url(bytes);
}
