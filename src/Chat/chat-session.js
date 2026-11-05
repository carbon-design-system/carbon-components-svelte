// @ts-check

import { writable } from "svelte/store";

/**
 * The state of an AI conversation, as a store: the messages, and what is
 * happening to the last. It sends the user's message to `onSend`, reads the
 * reply as it arrives, and can stop it, ask for it again, edit the last
 * prompt and send that, or try again after an error.
 */

/**
 * @typedef {import("./chat-adapters.js").ChatSource} ChatSource
 * @typedef {import("./chat-adapters.js").ChatChunk} ChatChunk
 */

/**
 * @typedef {object} ChatSessionMessage
 * @property {string} id
 * @property {"user" | "assistant"} role
 * @property {string} content - The text. For a reply, all that has arrived.
 * @property {ReadonlyArray<unknown>} attachments - What a user message was sent with.
 * @property {ChatSource[]} sources - What a reply cites.
 * @property {string} statusText - The latest status line of a reply, such as "Searching the docs".
 * @property {"done" | "streaming" | "stopped" | "error"} state
 * @property {unknown} [error] - What went wrong, when `state` is `"error"`.
 */

/**
 * @typedef {object} ChatSessionState
 * @property {ChatSessionMessage[]} messages
 * @property {"ready" | "submitted" | "streaming" | "error"} status
 * @property {unknown} [error]
 */

/**
 * @typedef {object} ChatRequest
 * @property {string} text
 * @property {ReadonlyArray<unknown>} attachments
 * @property {AbortSignal} signal
 * @property {ReadonlyArray<ChatSessionMessage>} messages - The conversation before this reply, including the prompt.
 */

let counter = 0;
const newId = () =>
  `chat-${++counter}-${Math.random().toString(36).slice(2, 8)}`;

/** @param {() => void} callback */
const nextFrame = (callback) =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : setTimeout(callback, 16);

/** @param {unknown} error */
const isAbort = (error) =>
  typeof error === "object" &&
  error !== null &&
  /** @type {{ name?: string }} */ (error).name === "AbortError";

/**
 * Anything `onSend` returns: an async iterable, or a `ReadableStream` in a
 * browser whose streams aren't async iterable yet.
 * @param {unknown} source
 * @returns {AsyncIterable<ChatChunk>}
 */
function toAsyncIterable(source) {
  const stream = /** @type {ReadableStream<ChatChunk> | undefined} */ (source);
  if (stream && typeof stream.getReader === "function") {
    return (async function* () {
      const reader = stream.getReader();
      try {
        for (;;) {
          // biome-ignore lint/performance/noAwaitInLoops: a stream is read one chunk at a time
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    })();
  }
  return /** @type {AsyncIterable<ChatChunk>} */ (source);
}

/**
 * @param {Partial<ChatSessionMessage> & { role: "user" | "assistant" }} message
 * @returns {ChatSessionMessage}
 */
function normalize(message) {
  return {
    id: message.id ?? newId(),
    role: message.role,
    content: message.content ?? "",
    attachments: message.attachments ?? [],
    sources: message.sources ?? [],
    statusText: message.statusText ?? "",
    state: message.state ?? "done",
    ...(message.error === undefined ? {} : { error: message.error }),
  };
}

/**
 * @param {object} options
 * @param {(request: ChatRequest) => AsyncIterable<ChatChunk> | ReadableStream<ChatChunk> | Promise<AsyncIterable<ChatChunk> | ReadableStream<ChatChunk>>} options.onSend
 *   Called with the prompt, its attachments, a signal that aborts when the
 *   reply is stopped, and the conversation so far. Returns the reply as an
 *   async iterable of text, or of `{ type: "text" | "source" | "status", ... }`.
 *   Throw to show an error.
 * @param {ReadonlyArray<Partial<ChatSessionMessage> & { role: "user" | "assistant" }>} [options.messages] - The conversation to start with.
 * @param {"frame" | "sync"} [options.update] - `"frame"` (default) joins the chunks that arrive within a frame into one update; `"sync"` updates for each, for tests.
 */
export function createChatSession({ onSend, messages = [], update = "frame" }) {
  /** @type {import("svelte/store").Writable<ChatSessionState>} */
  const store = writable({
    messages: messages.map(normalize),
    status: "ready",
  });
  /** @type {ChatSessionState} */
  let state = { messages: messages.map(normalize), status: "ready" };
  store.subscribe((value) => {
    state = value;
  });

  /** @type {AbortController | undefined} */
  let controller;
  /** A reply that is no longer the current one ignores what still arrives. */
  let generation = 0;
  /** What has arrived for the current reply and not been shown yet. */
  let pending = {
    text: "",
    sources: /** @type {ChatSource[]} */ ([]),
    status: "",
  };
  /** @type {unknown} */
  let scheduled;

  /** @param {Partial<ChatSessionState>} change */
  const set = (change) => store.set({ ...state, ...change });

  /** @param {(message: ChatSessionMessage) => ChatSessionMessage} change */
  function updateLast(change) {
    const last = state.messages.length - 1;
    if (last < 0) return;
    set({
      messages: state.messages.map((message, index) =>
        index === last ? change(message) : message,
      ),
    });
  }

  function flush() {
    scheduled = undefined;
    const { text, sources, status } = pending;
    if (!text && sources.length === 0 && !status) return;
    pending = { text: "", sources: [], status: "" };
    updateLast((message) => ({
      ...message,
      content: message.content + text,
      sources:
        sources.length > 0 ? [...message.sources, ...sources] : message.sources,
      statusText: status || message.statusText,
    }));
  }

  function schedule() {
    if (update === "sync") return flush();
    if (scheduled === undefined) scheduled = nextFrame(flush);
  }

  /** @param {ChatChunk} chunk */
  function take(chunk) {
    if (typeof chunk === "string") pending.text += chunk;
    else if (chunk?.type === "text") pending.text += chunk.text;
    else if (chunk?.type === "source") {
      const { type: _type, ...source } = chunk;
      pending.sources.push(source);
    } else if (chunk?.type === "status") pending.status = chunk.text;
    // A type this version doesn't know is left out, so an adapter can add
    // new ones without breaking an older page.
  }

  /**
   * @param {ChatSessionMessage["state"]} next
   * @param {unknown} [error]
   */
  function finish(next, error) {
    flush();
    updateLast((message) => ({
      ...message,
      state: next,
      statusText: "",
      ...(next === "error" ? { error } : {}),
    }));
    set({
      status: next === "error" ? "error" : "ready",
      error: next === "error" ? error : undefined,
    });
  }

  /**
   * Ask for a reply to the last user message.
   * @param {ChatSessionMessage[]} conversation - Ending with a user message.
   */
  async function reply(conversation) {
    const token = ++generation;
    const prompt = conversation[conversation.length - 1];
    controller = new AbortController();
    const { signal } = controller;
    pending = { text: "", sources: [], status: "" };
    set({
      messages: [
        ...conversation,
        normalize({ role: "assistant", state: "streaming" }),
      ],
      status: "submitted",
      error: undefined,
    });
    try {
      const source = await onSend({
        text: prompt.content,
        attachments: prompt.attachments,
        signal,
        messages: conversation,
      });
      for await (const chunk of toAsyncIterable(source)) {
        if (token !== generation) return;
        if (state.status === "submitted") set({ status: "streaming" });
        take(chunk);
        schedule();
      }
      if (token !== generation) return;
      finish("done");
    } catch (error) {
      if (token !== generation) return;
      finish(signal.aborted || isAbort(error) ? "stopped" : "error", error);
    }
  }

  const busy = () =>
    state.status === "submitted" || state.status === "streaming";

  /** The conversation up to and including the user message at `index`. */
  const through = (/** @type {number} */ index) =>
    state.messages.slice(0, index + 1);

  /**
   * Send a message, and read the reply. Does nothing, and returns `false`,
   * while a reply is arriving.
   * @param {{ text: string, attachments?: ReadonlyArray<unknown> }} message
   */
  function send({ text, attachments = [] }) {
    if (busy()) return false;
    reply([
      ...state.messages,
      normalize({ role: "user", content: text, attachments }),
    ]);
    return true;
  }

  /**
   * Stop the reply that is arriving. What has arrived stays, marked
   * `"stopped"`.
   */
  function stop() {
    if (!busy()) return;
    controller?.abort();
    generation++;
    finish("stopped");
  }

  /** Replace the last reply with a new one to the same prompt. */
  function regenerate() {
    stop();
    let index = state.messages.length - 1;
    while (index >= 0 && state.messages[index].role !== "user") index--;
    if (index < 0) return false;
    reply(through(index));
    return true;
  }

  /**
   * Change the text of a user message, drop everything after it, and read a
   * new reply.
   * @param {string} id
   * @param {string} text
   */
  function edit(id, text) {
    stop();
    const index = state.messages.findIndex(
      (message) => message.id === id && message.role === "user",
    );
    if (index < 0) return false;
    const conversation = through(index);
    conversation[index] = { ...conversation[index], content: text };
    reply(conversation);
    return true;
  }

  /**
   * Replace the conversation, such as for a new one.
   * @param {typeof messages} [next]
   */
  function reset(next = []) {
    controller?.abort();
    generation++;
    pending = { text: "", sources: [], status: "" };
    store.set({ messages: next.map(normalize), status: "ready" });
  }

  return { subscribe: store.subscribe, send, stop, regenerate, edit, reset };
}
