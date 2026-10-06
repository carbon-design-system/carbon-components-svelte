// @vitest-environment node
import Dialog from "carbon-components-svelte/Dialog/Dialog.svelte";
import { renderSSR } from "../utils/ssr";

describe("Dialog server render", () => {
  it("renders a closed dialog without the open attribute", () => {
    const { document } = renderSSR(Dialog, {});

    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("renders an open non-modal dialog with the open attribute", () => {
    const { document } = renderSSR(Dialog, { open: true, modal: false });

    expect(document.querySelector("dialog")).toHaveAttribute("open");
  });

  it("treats the dialog as non-modal by default", () => {
    const { document } = renderSSR(Dialog, { open: true });

    expect(document.querySelector("dialog")).toHaveAttribute("open");
  });

  it("leaves an open modal dialog closed until the client calls showModal()", () => {
    const { document } = renderSSR(Dialog, { open: true, modal: true });

    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
    expect(document.querySelector("dialog")).toHaveClass("bx--dialog--modal");
  });
});
