import { render, screen } from "@testing-library/svelte";
import UIShellLinkRel from "./UIShellLinkRel.test.svelte";

const brand = () => screen.getByRole("link", { name: /IBM/ });
const menuItem = () => screen.getByRole("link", { name: "API reference" });

describe("UI Shell links opening a new tab", () => {
  it("default rel to noopener noreferrer", () => {
    render(UIShellLinkRel);

    expect(brand()).toHaveAttribute("rel", "noopener noreferrer");
    expect(menuItem()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keep an explicit rel", () => {
    render(UIShellLinkRel, { props: { rel: "external" } });

    expect(brand()).toHaveAttribute("rel", "external");
    expect(menuItem()).toHaveAttribute("rel", "external");
  });
});
