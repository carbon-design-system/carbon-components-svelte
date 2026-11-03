import { render, screen } from "@testing-library/svelte";
import TextProps from "./TextProps.test.svelte";

describe("text props that replaced hard-coded English", () => {
  it("keeps the English defaults", () => {
    render(TextProps);

    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "pagination" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByText("AI label")).toBeInTheDocument();
  });

  it("uses the text the consumer passes", () => {
    render(TextProps, { props: { translated: true } });

    expect(
      screen.getByRole("link", { name: "Zum Inhalt springen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Seiten" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abbrechen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("KI-Label")).toBeInTheDocument();
  });
});
