// @vitest-environment node
import {
  caretRect,
  createInputLayer,
  rangeRects,
} from "../../src/utils/input-layer.js";
import { renderSSR } from "../utils/ssr";
import InputLayerAction from "./InputLayerAction.test.svelte";

describe("input layer (server)", () => {
  it("renders the field, which hydrates with its layer", () => {
    const { document } = renderSSR(InputLayerAction);

    const input = document.querySelector("input");
    expect(input?.getAttribute("class")).toBe("bx--text-input");
    expect(input?.value).toBe("is:open");
    // An action runs in the browser: nothing is added to the markup, so the
    // server's field is the one the browser hydrates.
    expect(document.querySelector(".bx--input-layer")).toBeNull();
    expect(input?.hasAttribute("data-ccs-input-layer")).toBe(false);
  });

  it("is imported, and measures nothing, without a document", () => {
    expect(typeof globalThis.document).toBe("undefined");
    const field = {
      localName: "input",
      isConnected: false,
    } as HTMLInputElement;

    expect(caretRect(field, 0)).toBeNull();
    expect(rangeRects(field, 0, 1)).toEqual([]);
    expect(typeof createInputLayer).toBe("function");
  });
});
