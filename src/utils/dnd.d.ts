import type { DndIntent, DndOrientation } from "./dnd-math.js";
import type { DndTextValues } from "./dnd-text.js";

/** What a press or a key lifts. */
export interface DndSource {
  /** The element that is picked up. It gets `data-dnd-lifted`. */
  item: HTMLElement;
  /** The id reported in the drop event, if the item has one. */
  id?: string;
  /** What the drag preview shows and announcements call the item. */
  label: string;
  /** Where the item is now, counting from 0. */
  index: number;
}

/**
 * Where a drop would land. Each adapter adds its own fields (an index, a
 * target row and a side); the engine reads only `zone` and `key`.
 */
export interface DndPosition {
  /** The zone that owns the position. */
  zone: DndZone;
  /**
   * Two positions with the same key are the same place. The engine uses it to
   * redraw only on a change and to recognize a drop in place.
   */
  key: string;
}

/** The values an announcement is built from. */
export interface DndDescription {
  /** The item's place, counting from 1. */
  position: number;
  /** The number of places there are, counting the item. */
  count: number;
  /** What announcements call the zone. */
  name: string;
  /**
   * Chosen by the zone, appended to the id of the string used: `""` is
   * `moved`, `"List"` is `movedList`, `"Before"` is `movedBefore`.
   */
  variant?: string;
  /** Anything else the zone's strings use, such as a target's name. */
  [value: string]: string | number | boolean | undefined;
}

/** A drag in progress. Handed to the zone so it can read where the pointer is. */
export interface DndSession {
  via: "pointer" | "keyboard";
  /** The zone the item was lifted from. */
  origin: DndZone;
  /** The zone the pointer or the keyboard is over, or `null` over nothing. */
  zone: DndZone | null;
  source: DndSource;
  /** The element lifted. A windowed list may replace it while it scrolls. */
  item: HTMLElement;
  /** Where the item started. Dropping here is a no-op. */
  home: DndPosition;
  /** Where a drop would land now, or `null` over nothing. */
  position: DndPosition | null;
  /** The pointer, in viewport pixels. */
  x: number;
  y: number;
  rtl: boolean;
  ghost: HTMLElement | null;
  indicator: HTMLElement;
  shown: DndZone | null;
  frame: number;
  placeFrame: number;
  reveals: number;
  lastTime: number;
  scroll: ReturnType<typeof import("./dnd-auto-scroll.js").createAutoScroll>;
  dispose(): void;
}

/**
 * What an adapter gives the engine: one droppable region and the rules of the
 * collision, the keys and the drawing inside it.
 */
export interface DndZone {
  /** The element that listens for presses and keys. */
  node: HTMLElement;
  /** Zones with the same group exchange items. */
  group?: string;
  /** Names the zone in drop events. */
  name: string;
  /** While `true`, the zone neither lifts nor accepts. */
  disabled: boolean;
  /** Which arrow keys step along the items, and which cross to a neighbor. */
  orientation: DndOrientation;
  rtl(): boolean;
  /** The string for an id, from `translateWithId` or the default. */
  text(id: string, values?: DndTextValues): string;
  /**
   * What `target` lifts, or `null`. For `"keyboard"`, `target` is the element
   * that has focus, and the engine asks on every Space, Enter or other key
   * the zone might lift with. For `"pointer"`, `event.pointerType` tells a
   * finger from a mouse.
   */
  sourceAt(
    target: Element,
    via: "pointer" | "keyboard",
    event: PointerEvent | KeyboardEvent,
  ): DndSource | null;
  /** The position that means "back where it started". */
  home(source: DndSource): DndPosition;
  /** The position under a point in viewport pixels, or `null`. */
  collide(x: number, y: number, session: DndSession): DndPosition | null;
  /**
   * The position a key intent steps to from `from`, or `null` to stay. The
   * intent `"enter"` means `from` belongs to another zone of the group and
   * the item is handed to this one.
   */
  step(
    session: DndSession,
    from: DndPosition,
    intent: DndIntent,
  ): DndPosition | null;
  /** The values an announcement for `position` is built from. */
  describe(session: DndSession, position: DndPosition): DndDescription;
  /**
   * Draw the feedback for `position`, or clear it for `null`. Return whether
   * it is in view, so the engine can ask `reveal` for a scroll.
   */
  indicate(
    session: DndSession,
    position: DndPosition | null,
    indicator: HTMLElement,
  ): boolean;
  /** Scroll `position` into view for a keyboard move. */
  reveal?(session: DndSession, position: DndPosition): void;
  /** Dispatch the cancelable drop event. Return `false` when it was refused. */
  commit(session: DndSession, position: DndPosition): boolean;
  /** Boxes the pointer may scroll, nearest first. */
  scrollers(): HTMLElement[];
  /** Layout may have changed since the last drag. */
  invalidate(): void;
  /** Read positions before a commit, for `settle`. */
  snapshot?(session: DndSession): unknown;
  /** After the consumer rendered the move, animate or tidy up. */
  settle?(session: DndSession, position: DndPosition, snapshot: unknown): void;
  /** Return keyboard focus to the item at `position`. */
  restoreFocus?(session: DndSession, position: DndPosition): void;
  /** The element that is the lifted item now, after a re-render. */
  itemFor?(session: DndSession): HTMLElement | undefined;
}

export interface DndConnection {
  /** Re-read `group` and `disabled`. */
  refresh(): void;
  destroy(): void;
}

export interface Dnd {
  /** Connect a zone: lifting by pointer and by keyboard, and its group. */
  connect(
    zone: DndZone,
    config?: { threshold?: () => number | undefined },
  ): DndConnection;
  readonly session: DndSession | null;
  zonesOf(group: string): DndZone[];
  cancel(): void;
  notify(zone: DndZone): void;
}

export function createDnd(): Dnd;

export function getDnd(): Dnd;

export function nextId(prefix: string): string;
