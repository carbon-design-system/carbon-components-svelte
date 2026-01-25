/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

export {
  isSvelte3,
  isSvelte4,
  isSvelte5,
  SVELTE_VERSION,
  setupLocalStorageMock,
  setupStorageEventMock,
  user,
} from "./utils/setup-shared";
