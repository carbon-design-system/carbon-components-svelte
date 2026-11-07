// @vitest-environment node
import SignaturePad from "carbon-components-svelte/SignaturePad/SignaturePad.svelte";
import { renderSSR } from "../utils/ssr";

describe("SignaturePad server render", () => {
  // The panels learn which switch is selected only after the switches
  // register, which never happens on the server.
  it("renders the open mode's panel visible and the others hidden", () => {
    const { document } = renderSSR(SignaturePad, {
      labelText: "Signature",
      modes: ["draw", "type"],
    });

    const [draw, type] = Array.from(
      document.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
    );
    expect(draw).not.toHaveAttribute("hidden");
    expect(type).toHaveAttribute("hidden");
    expect(draw.querySelector('[role="img"]')).toHaveAttribute(
      "aria-label",
      "Signature pad, draw your signature",
    );
  });

  it("opens the typed mode when it is the mode", () => {
    const { document } = renderSSR(SignaturePad, {
      labelText: "Signature",
      mode: "type",
    });

    const [draw, type] = Array.from(
      document.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
    );
    expect(draw).toHaveAttribute("hidden");
    expect(type).not.toHaveAttribute("hidden");
  });
});
