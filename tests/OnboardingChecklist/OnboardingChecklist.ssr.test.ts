// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Checklist from "./OnboardingChecklist.ssr.test.svelte";

function render(props: Record<string, unknown>) {
  return renderSSR(Checklist, props).document;
}

function checked(document: Document) {
  return [
    ...document.querySelectorAll<HTMLInputElement>("input[type=checkbox]"),
  ].map((box) => box.hasAttribute("checked"));
}

describe("OnboardingChecklist server render", () => {
  it("prints nothing until the stored progress is known", () => {
    expect(render({}).querySelector("[role=region]")).toBeNull();
  });

  it("prints every task unchecked when the page asks to show it while it waits", () => {
    const document = render({ pending: "show" });

    expect(document.querySelectorAll("li")).toHaveLength(3);
    expect(checked(document)).toEqual([false, false]);
    expect(
      document
        .querySelector("[role=progressbar]")
        ?.getAttribute("aria-valuetext"),
    ).toBe("1 of 3 complete");
  });

  it("prints the progress the server knows, with the app's own tasks right", () => {
    const document = render({ initial: { done: ["invite"] } });

    expect(checked(document)).toEqual([true, false]);
    expect(
      document
        .querySelector("[role=progressbar]")
        ?.getAttribute("aria-valuetext"),
    ).toBe("2 of 3 complete");
  });

  it("prints no checklist for a user who dismissed it", () => {
    expect(
      render({ initial: { dismissed: true } }).querySelector("[role=region]"),
    ).toBeNull();
  });

  it("prints a minimized floating checklist as a hidden panel and its launcher", () => {
    const document = render({ initial: { minimized: true }, floating: true });

    expect(
      document.querySelector("[role=region]")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(
      document
        .querySelector("button[aria-controls=setup]")
        ?.getAttribute("aria-label"),
    ).toBe("Getting started, 1 of 3 complete");
  });

  it("does not read the storage on the server", () => {
    const onRead = vi.fn();

    render({ pending: "show", onRead });

    expect(onRead).not.toHaveBeenCalled();
  });
});
