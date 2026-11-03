import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import {
  mediaQuery,
  observeMediaQuery,
} from "../../src/Breakpoint/media-query.js";
import {
  stubMatchMedia,
  stubMissingMatchMedia,
} from "../utils/stub-match-media.js";
// svelte-check's Svelte 4 compat pass can't resolve this fixture's
// declaration file, for reasons independent of file content (reproduces
// even for a trivial one-line fixture unrelated to MediaQuery). @ts-expect-error
// would itself fail under Svelte 5, where this import has no real error.
// biome-ignore lint/suspicious/noTsIgnore: see comment above
// @ts-ignore
import MediaQuery from "./MediaQuery.test.svelte";

describe("mediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders default values using the setup-globals matchMedia stub", () => {
    render(MediaQuery);

    expect(screen.getByTestId("wide").textContent).toBe("false");
    expect(screen.getByTestId("reduced-motion").textContent).toBe("false");
    expect(screen.getByTestId("color-scheme").textContent).toBe("light");
    expect(screen.getByTestId("orientation").textContent).toBe("landscape");
  });

  it("reflects a matching query", () => {
    stubMatchMedia((query) => query.includes("900px"));

    render(MediaQuery);

    expect(screen.getByTestId("wide").textContent).toBe("true");
  });

  it("updates when the query change fires", async () => {
    const { fire } = stubMatchMedia((query) => query.includes("900px"));

    render(MediaQuery);

    expect(screen.getByTestId("wide").textContent).toBe("true");

    fire("(min-width: 900px)", false);
    await tick();

    expect(screen.getByTestId("wide").textContent).toBe("false");
  });

  it("derives prefersColorScheme from a matching query", () => {
    stubMatchMedia((query) => query.includes("dark"));

    render(MediaQuery);

    expect(screen.getByTestId("color-scheme").textContent).toBe("dark");
  });

  it("derives orientation from a matching query", () => {
    stubMatchMedia((query) => query.includes("portrait"));

    render(MediaQuery);

    expect(screen.getByTestId("orientation").textContent).toBe("portrait");
  });

  it("does not throw when matchMedia is missing", () => {
    stubMissingMatchMedia();

    expect(() => render(MediaQuery)).not.toThrow();
  });

  it("falls back without ever invoking the callback when matchMedia is missing", () => {
    stubMissingMatchMedia();

    const spy = vi.fn();
    const unsubscribe = mediaQuery("(x)", { fallback: true }).subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(true);

    unsubscribe();
  });

  it("returns a cleanup function that never calls the callback when matchMedia is missing", () => {
    stubMissingMatchMedia();

    const callback = vi.fn();
    const cleanup = observeMediaQuery("(x)", callback);

    expect(callback).not.toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
  });

  it("removes the change listener when the last subscriber unsubscribes", () => {
    const { fire } = stubMatchMedia(() => false);

    const callback = vi.fn();
    const cleanup = observeMediaQuery("(min-width: 900px)", callback);

    expect(callback).toHaveBeenCalledTimes(1);

    cleanup();
    fire("(min-width: 900px)", true);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
