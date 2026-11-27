import { render, screen } from "@testing-library/svelte";
import { ANNOUNCER_READY_DELAY_MS } from "../../src/constants/timing.js";
import { getAnnouncer } from "../../src/utils/announcer.js";
import { user } from "../utils/user";
import Announcer from "./Announcer.test.svelte";

describe("Announcer", () => {
  afterEach(() => {
    getAnnouncer().destroy();
    vi.useRealTimers();
  });

  it("takes the messages at once, instead of a region in the body", async () => {
    render(Announcer);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(document.querySelectorAll("[data-announcer]")).toHaveLength(1);
  });

  it("hands the messages to a region of the page's own when it unmounts", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender } = render(Announcer);
    await rerender({ show: false });

    await user.click(screen.getByRole("button", { name: "Save" }));
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
