import { render } from "@testing-library/svelte";
import NotificationIcon from "carbon-components-svelte/Notification/NotificationIcon.svelte";

describe("NotificationIcon", () => {
  it("should render the base toast icon class by default", () => {
    const { container } = render(NotificationIcon);

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("bx--toast-notification__icon");
    expect(icon).toHaveClass("bx--toast-notification__icon--error");
  });

  it("should render the base inline icon class", () => {
    const { container } = render(NotificationIcon, {
      props: { notificationType: "inline", kind: "success" },
    });

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("bx--inline-notification__icon");
    expect(icon).toHaveClass("bx--inline-notification__icon--success");
  });

  it("should render the low contrast marker instead of the kind marker", () => {
    const { container } = render(NotificationIcon, {
      props: { kind: "warning-alt", lowContrast: true },
    });

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("bx--toast-notification__icon");
    expect(icon).toHaveClass(
      "bx--toast-notification__icon--low-contrast-warning-alt",
    );
    expect(icon).not.toHaveClass("bx--toast-notification__icon--warning-alt");
  });
});
