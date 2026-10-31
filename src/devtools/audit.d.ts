export type AuditCheck = "spacing" | "contrast" | "targets" | "overflow";

export type Rect = { left: number; top: number; width: number; height: number };

export type Severity = "error" | "warning" | "info";

export type Finding = {
  check: AuditCheck;
  severity: Severity;
  el: Element;
  rect: Rect;
  message: string;
  values?: Record<string, unknown>;
  related?: Element;
};

export type CheckOptions = {
  checks: AuditCheck[];
  band: import("./page-scan.js").ScanBand | null;
  carbon: boolean;
  ignore: string;
  targetSize: number;
  remPx: number;
  layer: (el: Element) => Element | null;
};

export type AuditFinding = {
  check: AuditCheck;
  /** `error` for WCAG failures and page overflow, `warning` for the app's off-scale spacing and clipped content, `info` for Carbon's own spacing. */
  severity: Severity;
  /** A short CSS path to the element. */
  selector: string;
  /** The Carbon block the element belongs to, such as `bx--btn`. */
  carbon: string | null;
  /** In page coordinates. */
  rect: Rect;
  message: string;
  values?: Record<string, unknown>;
  /** The element behind the finding: the target that crowds a target, or the element whose background text sits on. */
  related?: string;
  /** With `group`, how many findings merged into this one. */
  count?: number;
};

export const AUDIT_CHECKS: readonly [
  "spacing",
  "targets",
  "contrast",
  "overflow",
];
export const INTERACTIVE: string;
export function hasOwnText(el: Element): boolean;
/**
 * Whether Carbon styles `el`, not the app. Pass one `cache` to a whole
 * scan.
 */
export function carbonOwned(
  el: Element,
  cache?: Map<Element, boolean>,
): boolean;
export function formatRatio(ratio: number): string;
export function runChecks(options: CheckOptions): Finding[];
export function cssPath(el: Element): string;
export function carbonBlock(el: Element): string | null;

/**
 * Runs the page checks once over the whole page and returns the findings
 * as data. It does not wait, throttle, or limit itself to the viewport.
 */
export function audit(options?: {
  checks?: readonly AuditCheck[];
  /** Keep only findings inside elements that match this selector. */
  scope?: string;
  /** Check Carbon's own components too. */
  carbon?: boolean;
  /** Skip elements that match this selector, and everything inside them. */
  ignore?: string;
  targetSize?: number;
  /** Merge findings with the same check, selector, and message into one with a `count`. */
  group?: boolean;
}): { findings: AuditFinding[]; ms: number };
