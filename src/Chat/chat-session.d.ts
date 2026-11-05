import type { Readable } from "svelte/store";
import type { ChatChunk, ChatSource } from "./chat-adapters.js";

export interface ChatSessionMessage {
  id: string;
  role: "user" | "assistant";
  /** The text. For a reply, all that has arrived. */
  content: string;
  /** What a user message was sent with. */
  attachments: ReadonlyArray<unknown>;
  /** What a reply cites. */
  sources: ChatSource[];
  /** The latest status line of a reply, such as "Searching the docs". */
  statusText: string;
  state: "done" | "streaming" | "stopped" | "error";
  /** What went wrong, when `state` is `"error"`. */
  error?: unknown;
}

export interface ChatSessionState {
  messages: ChatSessionMessage[];
  /**
   * `"submitted"` is the wait for the first chunk and `"streaming"` the
   * reply arriving; `"error"` is the last reply failing.
   */
  status: "ready" | "submitted" | "streaming" | "error";
  error?: unknown;
}

export interface ChatRequest {
  text: string;
  attachments: ReadonlyArray<unknown>;
  /** Aborts when the reply is stopped or replaced. Pass it to `fetch`. */
  signal: AbortSignal;
  /** The conversation before this reply, including the prompt. */
  messages: ReadonlyArray<ChatSessionMessage>;
}

export interface ChatSession extends Readable<ChatSessionState> {
  /**
   * Send a message and read the reply. Does nothing, and returns `false`,
   * while a reply is arriving.
   */
  send(message: {
    text: string;
    attachments?: ReadonlyArray<unknown>;
  }): boolean;
  /** Stop the reply that is arriving. What has arrived stays, as `"stopped"`. */
  stop(): void;
  /** Replace the last reply with a new one to the same prompt. */
  regenerate(): boolean;
  /**
   * Change the text of a user message, drop everything after it, and read a
   * new reply.
   */
  edit(id: string, text: string): boolean;
  /** Replace the conversation, such as for a new one. */
  reset(
    messages?: ReadonlyArray<
      Partial<ChatSessionMessage> & { role: "user" | "assistant" }
    >,
  ): void;
}

/**
 * The state of an AI conversation, as a store: the messages, and what is
 * happening to the last. `onSend` returns the reply as an async iterable of
 * text, or of `{ type: "text" | "source" | "status", ... }`, such as from
 * `fakeChatStream`, `textStream` or `sseStream`; throw to show an error.
 */
export function createChatSession(options: {
  onSend: (
    request: ChatRequest,
  ) =>
    | AsyncIterable<ChatChunk>
    | ReadableStream<ChatChunk>
    | Promise<AsyncIterable<ChatChunk> | ReadableStream<ChatChunk>>;
  /** The conversation to start with. */
  messages?: ReadonlyArray<
    Partial<ChatSessionMessage> & { role: "user" | "assistant" }
  >;
  /**
   * `"frame"` (default) joins the chunks that arrive within a frame into
   * one update; `"sync"` updates for each.
   */
  update?: "frame" | "sync";
}): ChatSession;
