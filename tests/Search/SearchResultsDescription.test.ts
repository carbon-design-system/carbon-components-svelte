import { fireEvent, render, screen } from "@testing-library/svelte";
import { RESULTS_ANNOUNCE_DELAY_MS } from "../../src/constants/timing.js";
import SearchResultsDescription from "./SearchResultsDescription.test.svelte";

describe("Search resultsDescription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the results once typing pauses, not on mount", async () => {
    render(SearchResultsDescription, { props: { value: "ap" } });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "a" } });
    await vi.advanceTimersByTimeAsync(RESULTS_ANNOUNCE_DELAY_MS - 100);
    await fireEvent.input(input, { target: { value: "ban" } });
    await vi.advanceTimersByTimeAsync(RESULTS_ANNOUNCE_DELAY_MS - 1);
    expect(status).toHaveTextContent("");

    await vi.advanceTimersByTimeAsync(1);
    expect(status).toHaveTextContent("1 of 3 match ban");
  });

  it("waits for debounce when set", async () => {
    render(SearchResultsDescription, { props: { debounce: 200 } });
    const status = screen.getByRole("status");

    await fireEvent.input(screen.getByRole("searchbox"), {
      target: { value: "ap" },
    });
    await vi.advanceTimersByTimeAsync(200);
    expect(status).toHaveTextContent("2 of 3 match ap");
  });

  it("clears at once when the description becomes empty", async () => {
    render(SearchResultsDescription);
    const status = screen.getByRole("status");
    const input = screen.getByRole("searchbox");

    await fireEvent.input(input, { target: { value: "ap" } });
    await vi.advanceTimersByTimeAsync(RESULTS_ANNOUNCE_DELAY_MS);
    expect(status).toHaveTextContent("2 of 3 match ap");

    await fireEvent.input(input, { target: { value: "" } });
    expect(status).toHaveTextContent("");
  });

  it("renders no live region while unset", () => {
    render(SearchResultsDescription, { props: { describe: false } });
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
