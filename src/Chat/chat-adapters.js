// @ts-check

/**
 * Sources of a reply for `createChatSession`'s `onSend`: each returns an
 * async iterable of chunks, so a reply from a `fetch` and a reply made up
 * for a demo or a test look the same to the session.
 */

/**
 * @typedef {object} ChatSource
 * @property {string} [id]
 * @property {string} title
 * @property {string} [url]
 * @property {string} [snippet]
 */

/**
 * @typedef {string
 *   | { type: "text", text: string }
 *   | ({ type: "source" } & ChatSource)
 *   | { type: "status", text: string }} ChatChunk
 */

const WORDS = /\S+\s*/g;
const EVENT_END = /\r\n\r\n|\n\n|\r\r/;
const LINE_END = /\r\n|\n|\r/;
const LEADING_SPACE = /^ /;

function abortError() {
  return new DOMException("The reply was stopped", "AbortError");
}

/**
 * Wait, and stop waiting when `signal` aborts.
 * @param {number} ms
 * @param {AbortSignal} [signal]
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(undefined);
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * A reply made up for a demo or a test, a few words at a time, with no
 * network. It stops with an `AbortError` when `signal` aborts.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.wordsPerChunk] - Default 3.
 * @param {number} [options.intervalMs] - The pause between chunks. Default 16.
 * @param {number} [options.startDelayMs] - The wait before the first chunk, as a model takes to start. Default 0.
 * @param {string} [options.status] - A line before the text, such as "Searching the docs".
 * @param {ReadonlyArray<ChatSource>} [options.sources] - Sources after the text.
 * @param {number} [options.failAfter] - Throw after this many chunks, to try an error.
 * @param {AbortSignal} [options.signal]
 * @returns {AsyncGenerator<ChatChunk, void, undefined>}
 */
export async function* fakeChatStream(text, options = {}) {
  const {
    wordsPerChunk = 3,
    intervalMs = 16,
    startDelayMs = 0,
    status,
    sources = [],
    failAfter,
    signal,
  } = options;
  if (startDelayMs > 0) await sleep(startDelayMs, signal);
  if (status) yield { type: "status", text: status };
  const words = text.match(WORDS) ?? [];
  let count = 0;
  for (let at = 0; at < words.length; at += wordsPerChunk) {
    if (signal?.aborted) throw abortError();
    if (failAfter !== undefined && count >= failAfter) {
      throw new Error("The connection was lost");
    }
    yield words.slice(at, at + wordsPerChunk).join("");
    count++;
    // biome-ignore lint/performance/noAwaitInLoops: the pause between chunks is the point
    await sleep(intervalMs, signal);
  }
  for (const source of sources) yield { type: "source", ...source };
}

/**
 * The text of a `fetch` response as it arrives, for a server that streams
 * plain text. A character split between two chunks is held until the rest
 * comes.
 *
 * @param {Response} response
 * @returns {AsyncGenerator<string, void, undefined>}
 */
export async function* textStream(response) {
  if (!response.ok) {
    throw new Error(`The request failed with ${response.status}`);
  }
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      // biome-ignore lint/performance/noAwaitInLoops: a stream is read one chunk at a time
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (text) yield text;
    }
    const rest = decoder.decode();
    if (rest) yield rest;
  } finally {
    reader.releaseLock();
  }
}

/**
 * The events of a `fetch` response as it arrives, for a server that sends
 * server-sent events: the `data` of each, joined across lines. `[DONE]`,
 * as OpenAI-style servers end with, stops the stream. Set `parse` to turn
 * the data into a chunk, such as reading the text from a JSON payload;
 * return `undefined` to skip an event.
 *
 * @template [T=string]
 * @param {Response} response
 * @param {object} [options]
 * @param {(data: string) => T | undefined} [options.parse]
 * @returns {AsyncGenerator<T, void, undefined>}
 */
export async function* sseStream(response, options = {}) {
  const parse =
    options.parse ??
    /** @type {(data: string) => T | undefined} */ (
      (data) => /** @type {T} */ (/** @type {unknown} */ (data))
    );
  let buffer = "";
  for await (const text of textStream(response)) {
    buffer += text;
    // Events end at a blank line, in any of the three line endings.
    const events = buffer.split(EVENT_END);
    buffer = events.pop() ?? "";
    for (const event of events) {
      const data = event
        .split(LINE_END)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(LEADING_SPACE, ""))
        .join("\n");
      if (!data) continue;
      if (data === "[DONE]") return;
      const chunk = parse(data);
      if (chunk !== undefined) yield chunk;
    }
  }
}
