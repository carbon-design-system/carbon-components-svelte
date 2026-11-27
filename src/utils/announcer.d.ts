export type AnnounceOptions = {
  /**
   * A source of messages. A newer message on a channel replaces its earlier
   * one.
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
   * The element the message is about. In an open modal dialog, the message
   * goes into the dialog.
   */
  source?: Element | null;
};

export type Announcer = {
  announce: (message: string, options?: AnnounceOptions) => void;
  clear: (channel: string) => void;
  acquire: (source?: Element | null) => () => void;
  adopt: (region: HTMLElement) => () => void;
  destroy: () => void;
};

/** The announcer for a document. On the server every method does nothing. */
export function getAnnouncer(doc?: Document): Announcer;

/** Make an announcer for one document. Prefer `getAnnouncer`. */
export function createAnnouncer(doc: Document): Announcer;

/**
 * Say `message` to screen readers, politely. An empty message clears the
 * channel: its waiting message is dropped and its spoken one removed.
 */
export function announce(message: string, options?: AnnounceOptions): void;

/**
 * A channel of messages for one component instance. Call `connect()` in
 * `onMount` and call the function it returns when the component leaves.
 */
export function createAnnouncerChannel(
  /** The element the messages are about, read at each message. */
  getSource?: () => Element | null | undefined,
): {
  announce: (message: string, options?: { debounce?: number }) => void;
  clear: () => void;
  connect: () => () => void;
};
