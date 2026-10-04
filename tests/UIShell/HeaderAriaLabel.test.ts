import { render, screen } from "@testing-library/svelte";
import HeaderAriaLabel from "./HeaderAriaLabel.test.svelte";

describe("Header landmark label", () => {
  it("prefers uiShellAriaLabel over the company name", () => {
    render(HeaderAriaLabel, {
      props: {
        companyName: "IBM",
        platformName: "Cloud",
        uiShellAriaLabel: "IBM Cloud",
      },
    });

    expect(screen.getByRole("banner")).toHaveAttribute(
      "aria-label",
      "IBM Cloud",
    );
  });

  it("falls back to the company name, then the platform name", () => {
    const { unmount } = render(HeaderAriaLabel, {
      props: { companyName: "IBM", platformName: "Cloud" },
    });
    expect(screen.getByRole("banner")).toHaveAttribute("aria-label", "IBM");
    unmount();

    render(HeaderAriaLabel, { props: { platformName: "Cloud" } });
    expect(screen.getByRole("banner")).toHaveAttribute("aria-label", "Cloud");
  });

  it("omits the label when there is nothing to name it by", () => {
    render(HeaderAriaLabel);

    expect(screen.getByRole("banner")).not.toHaveAttribute("aria-label");
  });
});
