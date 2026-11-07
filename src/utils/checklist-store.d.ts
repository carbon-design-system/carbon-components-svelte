import type { Readable } from "svelte/store";

/**
 * What a checklist keeps for a user: the tasks they checked or skipped, and
 * where the checklist stands. The tasks the app detects are not in it; the
 * app owns those through `task.completed`.
 */
export interface ChecklistSnapshot {
  /** Ids of the tasks the user checked. */
  done: string[];
  /** Ids of the optional tasks the user skipped. */
  skipped: string[];
  /** `true` while a floating checklist is a launcher. */
  minimized: boolean;
  /** `true` once the user closed the checklist. */
  dismissed: boolean;
  /** `true` once the "All set" state was shown. */
  celebrated: boolean;
}

/**
 * Where a checklist store keeps its snapshot. `read` and `write` may be
 * asynchronous, as for progress synced with a server. `subscribe` reports
 * changes made elsewhere, such as in another tab, and returns a function that
 * stops listening.
 */
export interface ChecklistStorage {
  read(): ChecklistSnapshot | Promise<ChecklistSnapshot>;
  write(snapshot: ChecklistSnapshot): void | Promise<void>;
  subscribe?(callback: (snapshot: ChecklistSnapshot) => void): () => void;
}

export interface ChecklistStoreState {
  /**
   * `true` once the user's progress is known: from `initial`, or after the
   * storage was read.
   */
  ready: boolean;
  /** What a checklist renders while `ready` is `false`. */
  pending: "hide" | "show";
  done: ReadonlySet<string>;
  skipped: ReadonlySet<string>;
  minimized: boolean;
  dismissed: boolean;
  celebrated: boolean;
}

export interface ChecklistStoreOptions {
  /** Defaults to `localChecklistStorage()`. */
  storage?: ChecklistStorage;
  /**
   * Progress the server already knows, such as read from a cookie. The store
   * is `ready` from the first render, so the server and the first client
   * paint agree.
   */
  initial?: Partial<ChecklistSnapshot>;
  /**
   * What a checklist renders until the stored progress is known, on the
   * server and for the first client paint. `"hide"` (default) renders
   * nothing, so a user who dismissed it never sees it flash. `"show"` renders
   * the tasks unchecked.
   * @default "hide"
   */
  pending?: "hide" | "show";
  /**
   * Called when a read or a write fails. The progress still holds for the
   * session.
   */
  onError?: (error: unknown) => void;
}

export interface ChecklistStore extends Readable<ChecklistStoreState> {
  /** Check a task the user owns. */
  check(id: string): void;
  uncheck(id: string): void;
  /** Skip an optional task. */
  skip(id: string): void;
  unskip(id: string): void;
  /** Collapse a floating checklist to its launcher. */
  minimize(): void;
  /** Open a floating checklist from its launcher. */
  expand(): void;
  /** Close the checklist for good. */
  dismiss(): void;
  /** Bring back a dismissed checklist, open. */
  restore(): void;
  /** Remember that "All set" was shown. */
  celebrate(): void;
  /** Forget everything the user did. */
  reset(): void;
  /**
   * Read the storage once and listen for changes from other tabs. Call it in
   * `onMount`. Returns a function that lets go; the store stops listening
   * when every caller has.
   */
  connect(): () => void;
}

export interface ChecklistCta {
  text: string;
  /** Renders a link. Without it, a button. */
  href?: string;
}

export interface ChecklistTask {
  /** Unique within the checklist; the key of the user's progress. */
  id: string;
  title: string;
  description?: string;
  /**
   * Tasks with the same section are grouped under its heading, in order of
   * first appearance.
   */
  section?: string;
  /** The link or button that starts the task. */
  cta?: ChecklistCta;
  /**
   * Set by the app when it detects the task is done (or not). The task is
   * then app-owned: the user can't check it. Leave it unset for a task the
   * user checks.
   */
  completed?: boolean;
  /** The user can skip the task. */
  optional?: boolean;
}

export interface ChecklistItem {
  task: ChecklistTask;
  /** `true` when the app detects the task. */
  appOwned: boolean;
  status: "complete" | "incomplete" | "skipped";
}

export interface ChecklistSection {
  title: string | undefined;
  items: ChecklistItem[];
  complete: number;
  total: number;
}

export interface ChecklistProgress {
  items: ChecklistItem[];
  sections: ChecklistSection[];
  complete: number;
  skipped: number;
  /** Tasks that count: every task but the skipped ones. */
  total: number;
  allSet: boolean;
}

/** Turn any value read from storage or a cookie into a usable snapshot. */
export function toChecklistSnapshot(value: unknown): ChecklistSnapshot;

/**
 * Keep a checklist's progress in `localStorage` (or `sessionStorage`) as JSON
 * under `key`. A write also tells other stores that share the key, on the
 * page and in other tabs.
 */
export function localChecklistStorage(
  key?: string,
  type?: "localStorage" | "sessionStorage",
): ChecklistStorage;

/**
 * Read a checklist's progress from a cookie header, as a server does before
 * it renders. Pass the result to `createChecklistStore({ initial })`.
 * Returns `undefined` when the cookie is missing or unreadable, so a new
 * visitor stays `pending`.
 */
export function parseChecklistCookie(
  cookieHeader: string | null | undefined,
  name?: string,
): ChecklistSnapshot | undefined;

/**
 * Keep a checklist's progress in a cookie, so the server can render it as the
 * user left it. Read it on the server with `parseChecklistCookie`.
 */
export function cookieChecklistStorage(options?: {
  name?: string;
  maxAge?: number;
  path?: string;
}): ChecklistStorage;

/**
 * Remember what a user did in a getting-started checklist: the tasks they
 * checked or skipped, whether they minimized or dismissed it, and whether
 * they saw "All set". Create it inside a component, not at module scope.
 */
export function createChecklistStore(
  options?: ChecklistStoreOptions,
): ChecklistStore;

/** Share a checklist store with the components below the caller. */
export function setChecklistStore(store: ChecklistStore): void;

/** The store `setChecklistStore` shared with this component, if any. */
export function getChecklistStore(): ChecklistStore | undefined;

/**
 * Combine the app's tasks with what the user did. A task with a boolean
 * `completed` is app-owned and the stored progress is ignored for it; any
 * other task is complete when the user checked it. A skipped task leaves the
 * total.
 */
export function resolveChecklist(
  tasks: ReadonlyArray<ChecklistTask>,
  state: Pick<ChecklistStoreState, "done" | "skipped">,
): ChecklistProgress;
