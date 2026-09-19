// Not imported at runtime anymore (bun:test uses tests/bun/test-globals.ts
// instead) — kept so tsconfig's `include: ["."]` pulls in this side-effect
// import, which is what augments vitest's `Assertion` type with jest-dom
// matchers (toHaveClass, toBeInTheDocument, ...) for `bun run test:types`.
import "@testing-library/jest-dom/vitest";
