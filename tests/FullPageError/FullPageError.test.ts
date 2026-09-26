import { render, screen } from "@testing-library/svelte";
import FullPageError from "./FullPageError.test.svelte";

describe("FullPageError", () => {
  it("renders the required label, title, and description", () => {
    render(FullPageError);
    const root = screen.getByTestId("default").querySelector("[role=main]");

    expect(root).toHaveClass("bx--full-page-error");
    expect(root).toHaveTextContent("Error");
    expect(root).toHaveTextContent("Something went wrong");
    expect(root).toHaveTextContent("An unexpected error occurred.");
  });

  it("defaults to the custom illustration", () => {
    render(FullPageError);
    const root = screen.getByTestId("default").querySelector("[role=main]");

    expect(
      root?.querySelector("svg.bx--full-page-error__custom"),
    ).toBeInTheDocument();
  });

  it("renders the 403 illustration for kind='403'", () => {
    render(FullPageError);
    const root = screen.getByTestId("kind-403").querySelector("[role=main]");

    expect(
      root?.querySelector("svg.bx--full-page-error__403"),
    ).toBeInTheDocument();
  });

  it("renders the 404 illustration for kind='404'", () => {
    render(FullPageError);
    const root = screen.getByTestId("kind-404").querySelector("[role=main]");

    expect(
      root?.querySelector("svg.bx--full-page-error__404"),
    ).toBeInTheDocument();
  });

  it.each([
    ["default", "custom", "0 0 750 506"],
    ["kind-403", "403", "0 0 750 570"],
    ["kind-404", "404", "0 0 751 549"],
  ])(
    "keeps the %s illustration scalable, hidden and self-referencing",
    (testId, kind, viewBox) => {
      render(FullPageError);
      const svg = screen
        .getByTestId(testId)
        .querySelector(`svg.bx--full-page-error__${kind}`);

      expect(svg).toHaveAttribute("viewBox", viewBox);
      expect(svg).toHaveAttribute("aria-hidden", "true");

      const refs = [...(svg?.querySelectorAll("[clip-path]") ?? [])].map((el) =>
        el.getAttribute("clip-path"),
      );
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        const id = ref?.match(/^url\(#(.+)\)$/)?.[1];
        expect(svg?.querySelector(`clipPath[id="${id}"]`)).not.toBeNull();
      }
    },
  );

  it("renders extra body content passed via the default slot", () => {
    render(FullPageError);
    const root = screen.getByTestId("with-body");

    expect(root.querySelector("button")).toHaveTextContent("Go home");
  });

  it("overrides label, title, and description with their slots", () => {
    render(FullPageError);
    const root = screen.getByTestId("slottable");

    expect(root.querySelector("strong")).toHaveTextContent("Custom label");
    expect(root.querySelector("em")).toHaveTextContent("Custom title");
    expect(screen.getByTestId("custom-description")).toHaveTextContent(
      "Custom description",
    );
    expect(root).not.toHaveTextContent("Something went wrong");
    expect(root).not.toHaveTextContent("An unexpected error occurred.");
  });

  it("renders with slots alone, without label/title/description props", () => {
    render(FullPageError);
    const root = screen.getByTestId("slot-only");

    expect(root).toHaveTextContent("Slot label");
    expect(root).toHaveTextContent("Slot title");
    expect(root).toHaveTextContent("Slot description");
  });

  it("omits the description element when description and slot are both empty", () => {
    render(FullPageError);
    const root = screen
      .getByTestId("no-description")
      .querySelector("[role=main]");

    expect(
      root?.querySelector(".bx--full-page-error__description"),
    ).not.toBeInTheDocument();
  });

  it("renders a custom illustration via the illustration slot", () => {
    render(FullPageError);
    const root = screen
      .getByTestId("custom-illustration")
      .querySelector("[role=main]");

    expect(screen.getByTestId("custom-svg")).toBeInTheDocument();
    expect(
      root?.querySelector("svg.bx--full-page-error__custom"),
    ).not.toBeInTheDocument();
  });
});
