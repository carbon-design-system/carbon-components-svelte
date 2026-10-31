import type { Page } from "@playwright/test";
import type { AuditFinding } from "../../src/devtools/audit.js";
import { expect } from "./host";

type Options = {
  /** Checks to run. All four by default. */
  checks?: AuditFinding["check"][];
  /** Only findings inside elements that match this selector. */
  scope?: string;
  /** Check Carbon's own components too, as for a component's own test. */
  carbon?: boolean;
  /** Severities that fail. `info` (Carbon's v10 spacing) is left out by default. */
  severities?: AuditFinding["severity"][];
};

/**
 * The dev tools' page checks (`audit` from `/devtools`) on the mounted
 * fixture: off-scale spacing, low contrast, small targets (WCAG 2.5.8),
 * and overflow. Needs a fixture the shared host page mounts.
 */
export async function layoutFindings(page: Page, options: Options = {}) {
  const { severities = ["error", "warning"], ...rest } = options;
  const findings = await page.evaluate(
    (options) => window.__host.audit({ ...options, group: true }).findings,
    rest,
  );
  return findings.filter((f) => severities.includes(f.severity));
}

/**
 * Fails with one line per finding: its check, severity, selector, and
 * message, plus the values to fix it with.
 */
export async function expectNoLayoutFindings(
  page: Page,
  options: Options = {},
) {
  const findings = await layoutFindings(page, options);
  const lines = findings.map(
    (f) =>
      `${f.check} ${f.severity}: ${f.selector} · ${f.message}${f.values ? ` ${JSON.stringify(f.values)}` : ""}`,
  );
  expect(findings, lines.join("\n")).toEqual([]);
}
