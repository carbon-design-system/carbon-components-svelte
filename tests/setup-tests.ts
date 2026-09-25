/// <reference types="vitest/globals" />
import "./utils/setup-jest-dom";

// Files marked `// @vitest-environment node` have no DOM to stub.
if (typeof document !== "undefined") await import("./utils/setup-globals");
