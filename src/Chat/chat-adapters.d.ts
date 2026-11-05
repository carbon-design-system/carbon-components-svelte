/** A source a reply cites. */
export interface ChatSource {
  id?: string;
  title: string;
  url?: string;
  snippet?: string;
}

/**
 * One piece of a reply. A string is text; the others are objects with a
 * `type`. A `type` a session doesn't know is left out.
 */
export type ChatChunk =
  | string
  | { type: "text"; text: string }
  | ({ type: "source" } & ChatSource)
  | { type: "status"; text: string };

/**
 * A reply made up for a demo or a test, a few words at a time, with no
 * network. It stops with an `AbortError` when `signal` aborts.
 */
export function fakeChatStream(
  text: string,
  options?: {
    /** Default 3. */
    wordsPerChunk?: number;
    /** The pause between chunks, in milliseconds. Default 16. */
    intervalMs?: number;
    /** The wait before the first chunk, as a model takes to start. Default 0. */
    startDelayMs?: number;
    /** A line before the text, such as "Searching the docs". */
    status?: string;
    /** Sources after the text. */
    sources?: ReadonlyArray<ChatSource>;
    /** Throw after this many chunks, to try an error. */
    failAfter?: number;
    signal?: AbortSignal;
  },
): AsyncGenerator<ChatChunk, void, undefined>;

/**
 * The text of a `fetch` response as it arrives, for a server that streams
 * plain text. A character split between two chunks is held until the rest
 * comes.
 */
export function textStream(
  response: Response,
): AsyncGenerator<string, void, undefined>;

/**
 * The events of a `fetch` response as it arrives, for a server that sends
 * server-sent events: the `data` of each, joined across lines. `[DONE]`
 * stops the stream. Set `parse` to turn the data into a chunk, such as
 * reading the text from a JSON payload; return `undefined` to skip an
 * event.
 */
export function sseStream<T = string>(
  response: Response,
  options?: { parse?: (data: string) => T | undefined },
): AsyncGenerator<T, void, undefined>;
