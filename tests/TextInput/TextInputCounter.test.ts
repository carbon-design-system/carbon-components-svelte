import { fireEvent, render, screen } from "@testing-library/svelte";
import TextInput from "./TextInput.test.svelte";

function liveRegion() {
  const region = document.querySelector("[aria-live]");
  assert(region);
  return region;
}

async function typeValue(text: string) {
  await fireEvent.input(screen.getByRole("textbox"), {
    target: { value: text },
  });
}

describe("TextInput counter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("describes the count in words and hides the n/max text", () => {
    render(TextInput, {
      props: { maxCount: 100, value: "hi", helperText: "Lowercase only" },
    });

    expect(screen.getByText("2/100")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Lowercase only 2 of 100 characters",
    );
  });

  it("counts graphemes, not code units", () => {
    render(TextInput, { props: { maxCount: 10, value: "👍🏽é" } });

    expect(screen.getByText("2/10")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "2 of 10 characters",
    );
  });

  it("announces the limit in a polite, atomic live region once typing settles for 1s", async () => {
    render(TextInput, { props: { maxCount: 5 } });
    const region = liveRegion();
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");

    await typeValue("12345");
    await vi.advanceTimersByTimeAsync(999);
    expect(region).toHaveTextContent("");

    await vi.advanceTimersByTimeAsync(1);
    expect(region).toHaveTextContent("Character limit reached");

    await typeValue("1234");
    expect(region).toHaveTextContent("");
  });

  it("stays silent when the value leaves the limit within 1s", async () => {
    render(TextInput, { props: { maxCount: 5 } });

    const region = liveRegion();

    await typeValue("12345");
    await vi.advanceTimersByTimeAsync(500);
    expect(region).toHaveTextContent("");

    await typeValue("1234");
    await vi.advanceTimersByTimeAsync(1000);
    expect(region).toHaveTextContent("");
  });

  it("does not announce a value that starts at the limit", async () => {
    render(TextInput, { props: { maxCount: 5, value: "12345" } });
    await vi.advanceTimersByTimeAsync(1000);

    expect(liveRegion()).toHaveTextContent("");
  });

  it("uses custom counterText and limitReachedText", async () => {
    render(TextInput, {
      props: {
        maxCount: 3,
        value: "ab",
        counterText: (count: number, max: number) => `${count} von ${max}`,
        limitReachedText: "Limit erreicht",
      },
    });
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("2 von 3");

    await typeValue("abc");
    await vi.advanceTimersByTimeAsync(1000);
    expect(liveRegion()).toHaveTextContent("Limit erreicht");
  });

  it("renders no description or live region without maxCount", () => {
    render(TextInput, { props: { value: "hi" } });

    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    expect(document.querySelector("[aria-live]")).toBeNull();
  });
});
