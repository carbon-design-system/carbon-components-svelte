import { render, screen } from "@testing-library/svelte";
import Header from "carbon-components-svelte/UIShell/Header.svelte";
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

  it("names the banner, not the name link, with a consumer aria-labelledby", () => {
    render(Header, {
      props: {
        companyName: "IBM",
        href: "/",
        "aria-labelledby": "shell-title",
      },
    });

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("aria-labelledby", "shell-title");
    expect(banner).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps naming on the banner when there is no name link", () => {
    render(Header, {
      props: { "aria-label": "Shell", "aria-describedby": "shell-hint" },
    });

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("aria-label", "Shell");
    expect(banner).toHaveAttribute("aria-describedby", "shell-hint");
  });
});
