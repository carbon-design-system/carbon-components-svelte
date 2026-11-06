/** Time (ms) a message stays in its region before it is removed. */
export const ANNOUNCER_CLEAR_AFTER_MS: number;

/** Time (ms) a region exists before it is trusted with a message. */
export const ANNOUNCER_READY_DELAY_MS: number;

export type AnnouncerPoliteness = "polite" | "assertive";

export type AnnounceOptions = {
  /**
   * `"assertive"` interrupts what the reader is saying. Use it for a failure
   * the person must act on.
   * @default "polite"
   */
  politeness?: AnnouncerPoliteness;
  /**
   * A source of messages. A newer message on a channel replaces one that
   * has not been spoken yet.
   * @default "default"
   */
  channel?: string;
  /**
   * Wait this long (ms) after the last message on the channel, then say the
   * latest.
   * @default 0
   */
  debounce?: number;
  /**
   * Say at most one message per this many ms on the channel: the first at
   * once, then the latest after the gap.
   * @default 0
   */
  throttle?: number;
  /**
   * Skip a message equal to the channel's last one while that one is still
   * in the region.
   * @default false
   */
  dedupe?: boolean;
  /**
   * Remove the message from the region after this many ms.
   * @default 7000
   */
  clearAfter?: number;
  /**
   * The element the message is about. Inside an open modal dialog, the
   * message goes into the dialog.
   */
  source?: Element | null;
};

export type Announcer = {
  announce: (message: string, options?: AnnounceOptions) => void;
  clear: (channel?: string) => void;
  acquire: (options?: { assertive?: boolean }) => () => void;
  pushHost: (host: Element) => () => void;
  adopt: (regions: {
    polite: HTMLElement;
    assertive?: HTMLElement;
  }) => () => void;
  destroy: () => void;
};

/**
 * The announcer for a document. On the server, or with no document, every
 * method does nothing.
 */
export function getAnnouncer(doc?: Document): Announcer;

/** Make an announcer for one document. Prefer `getAnnouncer`. */
export function createAnnouncer(doc: Document): Announcer;

/** Say `message` to assistive technology. */
export function announce(message: string, options?: AnnounceOptions): void;

/**
 * Drop the pending message and remove the spoken message of one channel, or
 * of every channel.
 */
export function clearAnnouncements(channel?: string): void;

/**
 * Keep the live regions in the page, and create them now, so they exist well
 * before the first message. Call the returned function when the component
 * unmounts.
 */
export function acquireAnnouncer(options?: {
  /** Create the assertive region too. */
  assertive?: boolean;
}): () => void;

/**
 * Make `host` the place messages go until the returned function is called.
 * Call it when a modal opens, with the dialog element.
 */
export function pushAnnouncerHost(host: Element): () => void;

/**
 * A channel of messages for one component instance. Call `connect()` in
 * `onMount` and call the function it returns when the component leaves.
 */
export function createAnnouncerChannel(
  /** The element the messages are about, read at each message. */
  getSource?: () => Element | null | undefined,
): {
  id: string;
  announce: (message: string, options?: AnnounceOptions) => void;
  clear: () => void;
  connect: () => () => void;
};

export type SourceStatusEdge = {
  type: "idle" | "loading" | "success" | "error";
  /** `data.length` for an array. */
  count?: number;
  /** `"fetch"`, `"cache"`, `"more"`, `"length"`, `"cancel"` or `"reset"`. */
  reason?: string;
};

export type SourceStatusOptions = {
  /** @default "source" */
  channel?: string;
  /** The text for the loading edge. Leave it out to say nothing. */
  loading?: (edge: SourceStatusEdge) => string;
  /** The text for an answer with `count` items. */
  results: (count: number, edge: SourceStatusEdge) => string;
  /** The text for an appended page. */
  more?: (added: number, count: number, edge: SourceStatusEdge) => string;
  /** The text for a failure, said assertively. */
  error?: (edge: SourceStatusEdge) => string;
  /**
   * Wait this long before "loading", so an answer that comes first replaces it.
   * @default 500
   */
  loadingDelay?: number;
  /**
   * Wait this long after the last answer before the count.
   * @default 500
   */
  resultsDelay?: number;
  source?: Element | null;
};

/**
 * Speak the edges of an async source (the `onStatus` hook of
 * `createAsyncSource`) through the announcer. Returns the function that
 * stops it.
 */
export function announceSourceStatus(
  onStatus: (listener: (edge: SourceStatusEdge) => void) => void | (() => void),
  options: SourceStatusOptions,
): () => void;
