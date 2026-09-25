/// <reference types="vitest/globals" />
// Must import from this package so Vitest registers matchers (shared module alone does not).
import "@testing-library/jest-dom/vitest";

// Files marked `// @vitest-environment node` have no DOM to stub.
if (typeof document !== "undefined")
  await import("../tests/utils/setup-globals");
