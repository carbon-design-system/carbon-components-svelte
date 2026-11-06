import { render, screen } from "@testing-library/svelte";
import {
  ANNOUNCER_READY_DELAY_MS,
  getAnnouncer,
} from "../../src/utils/announcer.js";
import { user } from "../utils/user";
import Announcer from "./Announcer.test.svelte";

describe("Announcer", () => {
  afterEach(() => {
    getAnnouncer().destroy();
    vi.useRealTimers();
  });

  it("is in the page before any message", () => {
    render(Announcer);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByTestId("announcer")).toHaveAttribute("data-announcer");
  });

  it("takes the messages instead of a region in the body", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(Announcer);
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(document.querySelectorAll("[data-announcer]")).toHaveLength(1);
  });

  it("hands the messages back to a region of its own when it unmounts", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender } = render(Announcer);
    await rerender({ show: false });

    await user.click(screen.getByRole("button", { name: "Save" }));
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
