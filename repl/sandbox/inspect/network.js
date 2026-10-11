// Network log for the preview: wraps fetch and XMLHttpRequest, reports each
// request's method, URL, status, timing and size, with the response body as
// a remote preview (parsed JSON stays expandable).

const MAX_BODY = 200_000;
const JSON_TYPE = /json/i;
const LOOKS_LIKE_JSON = /^\s*[[{]/;

/** Response text → preview input: parsed JSON when it looks like JSON, else a trimmed string. */
export function bodyValue(text, contentType = "") {
  if (text === undefined || text === null) return undefined;
  const trimmed = text.length > MAX_BODY ? text.slice(0, MAX_BODY) : text;
  if (JSON_TYPE.test(contentType) || LOOKS_LIKE_JSON.test(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }
  return trimmed;
}

function requestBody(body) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return bodyValue(body);
  if (body instanceof URLSearchParams) return Object.fromEntries(body);
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return Object.fromEntries(
      [...body].map(([k, v]) => [
        k,
        typeof v === "string" ? v : `[File ${v.name}]`,
      ]),
    );
  }
  return `[${Object.prototype.toString.call(body).slice(8, -1)}]`;
}

/**
 * @param {{ post: (message: unknown) => void; preview: (value: unknown) => unknown }} options
 */
export function installNetwork({ post, preview }) {
  let nextId = 0;

  const start = (kind, method, url, body) => {
    const id = ++nextId;
    const begin = performance.now();
    post({
      type: "net",
      phase: "start",
      id,
      kind,
      method: method.toUpperCase(),
      url: String(url),
      time: Date.now(),
      request: body === undefined ? undefined : preview(requestBody(body)),
    });
    return {
      end(status, statusText, contentType, text) {
        post({
          type: "net",
          phase: "end",
          id,
          status,
          statusText,
          contentType,
          duration: performance.now() - begin,
          size: text?.length,
          response:
            text === undefined
              ? undefined
              : preview(bodyValue(text, contentType)),
        });
      },
      fail(error) {
        post({
          type: "net",
          phase: "error",
          id,
          duration: performance.now() - begin,
          error: String(error?.message ?? error),
        });
      },
    };
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    let method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    let url = input instanceof Request ? input.url : input;
    try {
      url = new URL(String(url), location.href).href;
    } catch {}
    method = String(method);
    const tracker = start("fetch", method, url, init?.body);
    try {
      const response = await nativeFetch(input, init);
      const contentType = response.headers.get("content-type") ?? "";
      response
        .clone()
        .text()
        .then(
          (text) =>
            tracker.end(
              response.status,
              response.statusText,
              contentType,
              text,
            ),
          () =>
            tracker.end(
              response.status,
              response.statusText,
              contentType,
              undefined,
            ),
        );
      return response;
    } catch (error) {
      tracker.fail(error);
      throw error;
    }
  };

  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__repl = {
      method: String(method),
      url: new URL(String(url), location.href).href,
    };
    return open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const info = this.__repl;
    if (info) {
      const tracker = start("xhr", info.method, info.url, body ?? undefined);
      this.addEventListener("loadend", () => {
        if (this.status === 0) tracker.fail("Network error or blocked by CORS");
        else {
          const text =
            this.responseType === "" || this.responseType === "text"
              ? this.responseText
              : undefined;
          tracker.end(
            this.status,
            this.statusText,
            this.getResponseHeader("content-type") ?? "",
            text,
          );
        }
      });
    }
    return send.call(this, body);
  };
}
