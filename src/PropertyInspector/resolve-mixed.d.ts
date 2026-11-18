// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a selected object is whatever the consumer holds.
export type Target = any;

export interface ResolvableProperty {
  id: string;
  /** The value that counts as unmodified. */
  default?: unknown;
  /** Whether an object has the property. */
  appliesTo?: (target: Target) => boolean;
  /** A fixed or per-object read-only flag. */
  readOnly?: boolean | ((target: Target) => boolean);
}

export interface ResolveOptions {
  /** Read one object's value. */
  getValue: (target: Target, id: string) => unknown;
  /** A per-object default, which wins over the property's. */
  getDefault?: (target: Target, id: string) => unknown;
  /** Compare two values. Defaults to deep equality. */
  equals?: (a: unknown, b: unknown) => boolean;
  /**
   * Show a property when every selected object has it (`"all"`, the
   * default) or when any does.
   */
  scope?: "all" | "any";
}

/** What the inspector shows for one property. */
export interface PropertyState {
  id: string;
  /** Whether the property is shown for this selection. */
  applicable: boolean;
  /** The number of selected objects that have the property. */
  count: number;
  /** Whether the objects hold different values. */
  mixed: boolean;
  /** The shared value, or `undefined` when mixed. */
  value: unknown;
  /** Whether any object differs from its default. */
  modified: boolean;
  /** Whether every object that has the property is read-only. */
  readOnly: boolean;
  /** How many are read-only. */
  readOnlyCount: number;
}

/** One value that changed on one object. */
export interface Change {
  target: Target;
  targetId: unknown;
  property: string;
  /** The value before the gesture began. */
  oldValue: unknown;
  newValue: unknown;
}

export interface PropertyOption {
  value: string | number;
  label: string;
}

export interface PropertyInspectorProperty extends ResolvableProperty {
  /** The key `getValue` reads, and the name in change events. */
  id: string;
  label: string;
  /** A name in `widgets` picks a custom control. */
  type:
    | "text"
    | "number"
    | "boolean"
    | "toggle"
    | "select"
    | "dropdown"
    | "radio"
    | "color"
    | (string & {});
  /** The group the property sits in. Its `groups` entry gives the heading. */
  group?: string;
  /** Properties with the same `row` in a group share a line. */
  row?: string;
  /** The label of the shared line. */
  rowLabel?: string;
  /** The choices of a `select`, `dropdown` or `radio`. */
  options?: PropertyOption[];
  min?: number;
  max?: number;
  /** The size of a key press and a drag step. Defaults to `1`. */
  step?: number;
  /** A unit shown inside the number field. */
  unit?: string;
  /** The unit as a screen reader says it, such as "pixels". */
  unitLabel?: string;
  placeholder?: string;
  /** Extra words the search matches. */
  keywords?: string[];
  /** The id of the property whose ratio this one keeps while its row is locked. */
  lockWith?: string;
}

export interface PropertyEdit {
  kind: "set" | "add" | "multiply";
  /** The number a `set`, `add` or `multiply` of a number uses. */
  n?: number;
  /** The new value of a `set` that is not a number. */
  value?: unknown;
}

export type EditSource = "input" | "key" | "scrub";

export interface InspectorApi {
  start(property: string, source: EditSource): void;
  update(property: string, edit: PropertyEdit): void;
  end(property?: string): void;
  commit(property: string, edit: PropertyEdit, source: EditSource): void;
  reset(properties: string[]): void;
  toggleLock(row: string): void;
}

export interface GestureEntry {
  target: Target;
  targetId: unknown;
  property: string;
  from: unknown;
}

export function targetsOf(
  selection: ReadonlyArray<Target>,
  property: ResolvableProperty,
): ReadonlyArray<Target>;

/** The objects an edit reaches: those that have the property and are not read-only. */
export function editableTargets(
  selection: ReadonlyArray<Target>,
  property: ResolvableProperty,
): ReadonlyArray<Target>;

export function resolveProperty(
  selection: ReadonlyArray<Target>,
  property: ResolvableProperty,
  options: ResolveOptions,
): PropertyState;

/**
 * Resolve every property. A state equal to the one in `previous` is reused.
 */
export function resolveProperties(
  selection: ReadonlyArray<Target>,
  properties: ReadonlyArray<ResolvableProperty>,
  options: ResolveOptions,
  previous?: ReadonlyMap<string, PropertyState>,
): Map<string, PropertyState>;

export function createGesture(entries: ReadonlyArray<GestureEntry>): {
  /**
   * Compute every entry's new value. Returns every entry with its latest
   * value, or `null` when nothing moved since the last update.
   */
  update(valueFor: (entry: GestureEntry) => unknown): Change[] | null;
  /** The entries whose value differs from where the gesture began. */
  changes(): Change[];
};
