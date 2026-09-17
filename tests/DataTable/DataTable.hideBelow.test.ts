import { render, screen } from "@testing-library/svelte";
import DataTable from "./DataTable.hideBelow.test.svelte";

const QUERY = {
  sm: "(max-width: 672px)",
  md: "(min-width: 672px) and (max-width: 1056px)",
  lg: "(min-width: 1056px) and (max-width: 1312px)",
  xlg: "(min-width: 1312px) and (max-width: 1584px)",
  max: "(min-width: 1584px)",
};

function stubMatchMedia(initialQuery: string) {
  const listeners = new Map<string, Array<(event: unknown) => void>>();

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === initialQuery,
    media: query,
    addEventListener: (event: string, listener: (event: unknown) => void) => {
      if (event !== "change") return;
      if (!listeners.has(query)) listeners.set(query, []);
      listeners.get(query).push(listener);
    },
    removeEventListener: vi.fn(),
  }));

  return listeners;
}

function changeBreakpoint(
  listeners: Map<string, Array<(event: unknown) => void>>,
  nextQuery: string,
) {
  for (const [query, queryListeners] of listeners.entries()) {
    for (const listener of queryListeners) {
      listener({ matches: query === nextQuery, media: query });
    }
  }
}

describe("DataTable hideBelow/hideAbove", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("hides a hideBelow column and its cells below the breakpoint", () => {
    stubMatchMedia(QUERY.sm);

    render(DataTable);

    expect(screen.queryByText("Protocol")).toBeNull();
    expect(screen.queryByText("HTTP")).toBeNull();
    expect(screen.getByText("Rule")).toBeInTheDocument();
    expect(screen.getByText("Round robin")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Port")).toBeInTheDocument();
  });

  it("shows a hideBelow column and hides a hideAbove column at a larger breakpoint", async () => {
    const listeners = stubMatchMedia(QUERY.sm);

    render(DataTable);

    changeBreakpoint(listeners, QUERY.lg);
    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByText("Protocol")).toBeInTheDocument();
    expect(screen.getAllByText("HTTP")).toHaveLength(2);
    expect(screen.queryByText("Rule")).toBeNull();
    expect(screen.queryByText("Round robin")).toBeNull();
  });
});
