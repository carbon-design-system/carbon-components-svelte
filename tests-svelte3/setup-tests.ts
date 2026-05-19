/// <reference types="vitest/globals" />
// Must import from this package so Vitest registers matchers (shared module alone does not).
import "@testing-library/jest-dom/vitest";
import "../tests/utils/setup-globals";

export { setupLocalStorageMock } from "../tests/utils/storage-mocks";
export { isSvelte5 } from "../tests/utils/svelte-version";
export { user } from "../tests/utils/user";
