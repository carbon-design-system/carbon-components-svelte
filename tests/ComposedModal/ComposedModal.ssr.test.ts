// @vitest-environment node
import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";
import ComposedModalSsr from "./ComposedModalSsr.test.svelte";

describe("ComposedModal server render", () => {
  it("keeps a consumer aria-label", () => {
    const { document } = renderSSR(ComposedModalSsr, {
      ariaLabel: "Delete file",
    });
    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog).toHaveAttribute("aria-label", "Delete file");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps a consumer aria-labelledby on the dialog", () => {
    const { document } = renderSSR(ComposedModalSsr, {
      ariaLabelledby: "custom-heading",
    });

    expect(document.querySelector('[role="dialog"]')).toHaveAttribute(
      "aria-labelledby",
      "custom-heading",
    );
    expect(document.querySelector(".bx--modal")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("renders identical markup for an explicit id", () => {
    const renderRaw = () =>
      render(ComposedModalSsr, { props: { id: "confirm" } }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives the header and body ids from the id", () => {
    const { document } = renderSSR(ComposedModalSsr, { id: "confirm" });

    expect(document.querySelector(".bx--modal")).toHaveAttribute(
      "id",
      "confirm",
    );
    expect(document.querySelector('[role="dialog"]')).toHaveAttribute(
      "aria-labelledby",
      "confirm-label confirm-title",
    );
    expect(document.getElementById("confirm-label")).toHaveTextContent("Label");
    expect(document.getElementById("confirm-title")).toHaveTextContent("Title");
    expect(document.getElementById("confirm-body")).toHaveTextContent("Body");
  });

  it("renders an open ComposedModal as visible", () => {
    const { document } = renderSSR(ComposedModal, { open: true });

    expect(document.querySelector(".bx--modal")).toHaveClass("is-visible");
  });
});
