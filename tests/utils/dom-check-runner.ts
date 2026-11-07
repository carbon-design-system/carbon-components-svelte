// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- a runner extends vitest's; it isn't a global
import { TestRunner } from "vitest";

type Finding = {
  rule: string;
  element: string;
  detail: string;
  id: string | null;
};
type Checks = {
  enabled(): boolean;
  run(): void;
  take(): Finding[];
  cancel(): void;
};
type Globals = {
  __domEnv?: { checks: Checks };
  __domChecksSkip?: Set<string>;
};

const globals = globalThis as Globals;

/**
 * An id the library made (`uniqueId()`: `ccs-` and random base 36), not
 * one a test or a consumer passed in. A test that names an id it never
 * renders, or renders a fixture twice with one id, is its own business.
 */
const GENERATED_ID = /^ccs-[a-z0-9]{8,}/;

function reported({ rule, id }: Finding) {
  if (globals.__domChecksSkip?.has(rule)) return false;
  return id === null || GENERATED_ID.test(id);
}

/**
 * Runs dom-env's DOM checks (dom-env/src/checks.js) when a test's body
 * finishes, before any `afterEach` hook closes a menu or cleans up, and
 * fails the test with what they and the checks after each interaction
 * found. `DOM_ENV_CHECKS=warn` prints them instead.
 */
export default class DomCheckRunner extends TestRunner {
  override async onBeforeTryTask(
    ...args: Parameters<TestRunner["onBeforeTryTask"]>
  ) {
    await super.onBeforeTryTask(...args);
    globals.__domChecksSkip = undefined;
    const checks = globals.__domEnv?.checks;
    if (!checks?.enabled()) return;
    checks.cancel();
    checks.take();
  }

  override async onAfterTryTask(
    ...args: Parameters<TestRunner["onAfterTryTask"]>
  ) {
    await super.onAfterTryTask(...args);
    const checks = globals.__domEnv?.checks;
    if (!checks?.enabled()) return;
    checks.cancel();
    checks.run();
    const found = checks.take().filter(reported);
    if (found.length === 0) return;
    const list = found
      .map(({ rule, element, detail }) => `  ${rule}: ${element} ${detail}`)
      .join("\n");
    const message = `DOM checks:\n${list}`;
    if (process.env.DOM_ENV_CHECKS === "warn") console.warn(message);
    else throw new Error(message);
  }
}
