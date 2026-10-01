// @vitest-environment node
import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
import Modal from "carbon-components-svelte/Modal/Modal.svelte";
import { renderSSR } from "../utils/ssr";

describe("Modal server render", () => {
  it("renders an open Modal as visible", () => {
    const { document } = renderSSR(Modal, { open: true });

    expect(document.querySelector(".bx--modal")).toHaveClass("is-visible");
  });

  it("renders an open ComposedModal as visible", () => {
    const { document } = renderSSR(ComposedModal, { open: true });

    expect(document.querySelector(".bx--modal")).toHaveClass("is-visible");
  });
});
