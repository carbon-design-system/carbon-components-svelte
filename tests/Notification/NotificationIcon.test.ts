import { render, screen } from "@testing-library/svelte";
import NotificationIcon from "carbon-components-svelte/Notification/NotificationIcon.svelte";

describe("NotificationIcon", () => {
  it("hides the icon from screen readers without iconDescription", () => {
    const { container } = render(NotificationIcon, {
      props: { kind: "warning" },
    });

    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("role");
    expect(icon?.querySelector("title")).toBeNull();
  });

  it("names the icon once, through role img and its title", () => {
    render(NotificationIcon, {
      props: { kind: "warning", iconDescription: "Warning" },
    });

    const icon = screen.getByRole("img", { name: "Warning" });
    expect(icon).toHaveAttribute("role", "img");
    expect(icon).not.toHaveAttribute("aria-label");
    expect(icon.querySelector("title")).toHaveTextContent("Warning");
  });
});
