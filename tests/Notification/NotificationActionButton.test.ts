import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import NotificationActionButtonTest from "./NotificationActionButton.test.svelte";

describe("NotificationActionButton", () => {
  it("renders a small ghost button with the action class", () => {
    render(NotificationActionButtonTest);

    const button = screen.getByRole("button", { name: "Undo" });
    expect(button).toHaveClass(
      "bx--inline-notification__action-button",
      "bx--btn--ghost",
      "bx--btn--sm",
    );
  });

  it("keeps the action class when a consumer class is passed", () => {
    render(NotificationActionButtonTest, { props: { class: "custom" } });

    expect(screen.getByRole("button", { name: "Undo" })).toHaveClass(
      "bx--inline-notification__action-button",
      "custom",
    );
  });

  it("forwards click", async () => {
    const onclick = vi.fn();
    render(NotificationActionButtonTest, { props: { onclick } });

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
