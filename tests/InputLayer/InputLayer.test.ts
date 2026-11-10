import { fireEvent, render, screen } from "@testing-library/svelte";
import {
  caretRect,
  createInputLayer,
  rangeRects,
} from "../../src/utils/input-layer.js";
import InputLayerAction from "./InputLayerAction.test.svelte";

// jsdom has no layout, so these are the parts that do not need one: what the
// layer adds and takes away, what it draws, and when. Where it sits is the
// end to end file's.
describe("createInputLayer", () => {
  let host: HTMLDivElement;
  let input: HTMLInputElement;

  const qualifiers = (value: string) =>
    value
      .split(/(\S+:\S*)/)
      .filter(Boolean)
      .map((text) =>
        text.includes(":") ? { text, className: "q" } : { text },
      );

  beforeEach(() => {
    document.body.innerHTML = `<div id="host"><input id="field" value="is:open free"></div>`;
    host = document.querySelector("#host") as HTMLDivElement;
    input = document.querySelector("#field") as HTMLInputElement;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const layerEl = () => host.querySelector(".bx--input-layer") as HTMLElement;

  it("adds a hidden layer after the field and marks the field and its host", () => {
    const layer = createInputLayer(input);

    expect(layerEl()).toBe(layer.element);
    expect(host.lastElementChild).toBe(layer.element);
    expect(layer.element.getAttribute("aria-hidden")).toBe("true");
    expect(layer.element.classList).toContain("bx--input-layer--behind");
    expect(layer.element.classList).toContain("bx--input-layer--line");
    expect(input.getAttribute("data-ccs-input-layer")).toBe("behind");
    expect(input.hasAttribute("data-ccs-input-layer-ink")).toBe(false);
    expect(host.classList).toContain("bx--input-layer-host");
    // The field is not wrapped, moved or given a class.
    expect(input.parentElement).toBe(host);
    expect(input.className).toBe("");

    layer.destroy();
  });

  it("draws the field's value as one run by default", () => {
    const layer = createInputLayer(input);

    expect(layer.content.textContent).toBe("is:open free");
    expect(layer.content.children).toHaveLength(1);

    layer.destroy();
  });

  it("draws the runs the segments function cuts, and again on every input", () => {
    const layer = createInputLayer(input, { segments: qualifiers });
    expect(
      Array.from(layer.content.children).map((span) => span.className),
    ).toEqual(["q", ""]);

    input.value = "is:open label:bug";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(layer.content.textContent).toBe("is:open label:bug");
    expect(layer.content.querySelectorAll(".q")).toHaveLength(2);

    layer.destroy();
  });

  it("draws a value that was set from code when asked to", () => {
    const layer = createInputLayer(input, { segments: qualifiers });

    input.value = "-label:x";
    expect(layer.content.textContent).toBe("is:open free");
    layer.update();

    expect(layer.content.textContent).toBe("-label:x");
    layer.update((value) => [{ text: value.toUpperCase() }]);
    expect(layer.content.textContent).toBe("-LABEL:X");

    layer.destroy();
  });

  it("draws runs it is given, as text", () => {
    const layer = createInputLayer(input);

    layer.render([{ text: "<b>x</b>", className: "r" }]);

    expect(layer.content.textContent).toBe("<b>x</b>");
    expect(layer.content.querySelector("b")).toBeNull();

    layer.destroy();
  });

  it("sits above, and takes the field's glyphs, for ink: layer", () => {
    const layer = createInputLayer(input, { ink: "layer", position: "behind" });

    expect(layer.element.classList).toContain("bx--input-layer--above");
    expect(layer.element.classList).toContain("bx--input-layer--ink");
    expect(input.getAttribute("data-ccs-input-layer")).toBe("above");
    expect(input.getAttribute("data-ccs-input-layer-ink")).toBe("layer");
    // Only a layer behind the field needs the host to be its own stack.
    expect(host.classList).not.toContain("bx--input-layer-host");

    layer.destroy();
  });

  it("marks a textarea's layer as a block", () => {
    document.body.innerHTML = `<div id="host"><textarea id="field">a\nb</textarea></div>`;
    const area = document.querySelector("textarea") as HTMLTextAreaElement;
    const layer = createInputLayer(area, { className: "mine" });

    expect(layer.element.classList).toContain("bx--input-layer--block");
    expect(layer.element.classList).toContain("mine");

    layer.destroy();
  });

  it("goes to the container it is given", () => {
    const other = document.createElement("div");
    document.body.appendChild(other);
    const layer = createInputLayer(input, { container: other });

    expect(layer.element.parentElement).toBe(other);
    expect(host.querySelector(".bx--input-layer")).toBeNull();

    layer.destroy();
  });

  it("gives the field and its host back", () => {
    const layer = createInputLayer(input, { ink: "layer" });
    layer.destroy();

    expect(layerEl()).toBeNull();
    expect(input.hasAttribute("data-ccs-input-layer")).toBe(false);
    expect(input.hasAttribute("data-ccs-input-layer-ink")).toBe(false);

    const behind = createInputLayer(input);
    behind.destroy();
    expect(host.classList).not.toContain("bx--input-layer-host");
    // Twice is harmless.
    behind.destroy();
  });

  it("leaves a host class that was there before", () => {
    host.classList.add("bx--input-layer-host");
    createInputLayer(input).destroy();

    expect(host.classList).toContain("bx--input-layer-host");
  });

  it("stops hearing the field once destroyed", () => {
    const layer = createInputLayer(input, { segments: qualifiers });
    layer.destroy();

    input.value = "x:y";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(layer.content.textContent).toBe("is:open free");
  });

  it("is one layer for a field: a second replaces the first", () => {
    const first = createInputLayer(input);
    const second = createInputLayer(input, { position: "above" });

    expect(host.querySelectorAll(".bx--input-layer")).toHaveLength(1);
    expect(first.element.isConnected).toBe(false);
    expect(second.element.isConnected).toBe(true);
    expect(input.getAttribute("data-ccs-input-layer")).toBe("above");
    expect(host.classList).not.toContain("bx--input-layer-host");

    second.destroy();
  });

  it("draws again when the form is reset", async () => {
    const form = document.createElement("form");
    host.appendChild(form);
    form.appendChild(input);
    input.defaultValue = "is:open free";
    const layer = createInputLayer(input);

    input.value = "changed";
    layer.update();
    expect(layer.content.textContent).toBe("changed");
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(layer.content.textContent).toBe("is:open free");

    layer.destroy();
  });

  it("measures nothing where there is no layout", () => {
    const layer = createInputLayer(input);

    expect(layer.caretRect(2)).toBeNull();
    expect(layer.rangeRects(0, 3)).toEqual([]);
    expect(layer.ghostShifts()).toBe(false);
    expect(caretRect(input, 2)).toBeNull();
    expect(rangeRects(input, 0, 3)).toEqual([]);

    layer.destroy();
  });
});

describe("inputLayer action", () => {
  it("adds the layer on mount and removes it on destroy", () => {
    const { unmount } = render(InputLayerAction);
    const field = screen.getByTestId("field");

    expect(
      field.parentElement?.querySelector(".bx--input-layer"),
    ).not.toBeNull();
    expect(
      field.parentElement?.querySelector(".bx--input-layer__content")
        ?.textContent,
    ).toBe("is:open");

    unmount();
    expect(document.querySelector(".bx--input-layer")).toBeNull();
  });

  it("draws what is typed, and what the app sets", async () => {
    const { rerender } = render(InputLayerAction);
    const field = screen.getByTestId("field") as HTMLInputElement;
    const content = () =>
      field.parentElement?.querySelector(".bx--input-layer__content");

    await fireEvent.input(field, { target: { value: "is:open x:1" } });
    expect(content()?.textContent).toBe("is:open x:1");
    expect(content()?.querySelectorAll(".q")).toHaveLength(2);

    await rerender({ value: "set:later" });
    expect(field.value).toBe("set:later");
    expect(content()?.textContent).toBe("set:later");
  });

  it("builds the layer again when its position changes", async () => {
    const { rerender } = render(InputLayerAction);
    const field = screen.getByTestId("field");
    expect(field.getAttribute("data-ccs-input-layer")).toBe("behind");

    await rerender({ position: "above" });

    expect(field.getAttribute("data-ccs-input-layer")).toBe("above");
    expect(document.querySelectorAll(".bx--input-layer")).toHaveLength(1);
  });
});
