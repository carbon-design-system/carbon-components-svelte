import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import PasswordRequirements from "carbon-components-svelte/PasswordStrength/PasswordRequirements.svelte";
import { passwordRules } from "carbon-components-svelte/PasswordStrength/rules.js";
import PasswordForm from "./PasswordForm.test.svelte";

const items = () => within(screen.getByRole("list")).getAllByRole("listitem");

describe("PasswordRequirements", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a labelled list with one item per rule, and the NIST rules by default", () => {
    render(PasswordRequirements, { value: "" });

    expect(screen.getByRole("list")).toHaveAccessibleName(
      "Password requirements",
    );
    expect(items().map((item) => item.textContent?.trim())).toEqual([
      "At least 12 characters, not met",
      "Not a commonly used password, not met",
    ]);
  });

  it("states each item's state in text, not only in its icon", async () => {
    const { rerender } = render(PasswordRequirements, {
      value: "short",
      requirements: [passwordRules.minLength(12), passwordRules.hasNumber()],
    });
    expect(items()[0]).toHaveTextContent("At least 12 characters, not met");
    expect(items()[1]).toHaveTextContent("A number, not met");

    await rerender({ value: "a-long-pass-1" });
    expect(items()[0]).toHaveTextContent("At least 12 characters, met");
    expect(items()[1]).toHaveTextContent("A number, met");
  });

  it("hides the state text from sight and the icon from the tree", () => {
    const { container } = render(PasswordRequirements, { value: "x" });

    const hidden = container.querySelector(
      ".bx--password-requirements__item .bx--visually-hidden",
    );
    expect(hidden).toHaveTextContent(", not met");
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("uses a different icon for met, unmet and an error", async () => {
    const requirements = [
      passwordRules.minLength(4),
      passwordRules.hasNumber(),
    ];
    const { container, rerender } = render(PasswordRequirements, {
      value: "abcd",
      requirements,
    });
    const shapes = () =>
      [...container.querySelectorAll("svg")].map((svg) => svg.innerHTML);

    const [met, unmet] = shapes();
    expect(met).not.toBe(unmet);

    await rerender({ invalid: true });
    const [, error] = shapes();
    expect(error).not.toBe(unmet);
    expect(error).not.toBe(met);
    expect(
      container.querySelector(".bx--password-requirements__item--invalid"),
    ).toHaveTextContent("A number");
  });

  it("binds `valid` and `unmet`, and `when` leaves a rule out", async () => {
    const { rerender } = render(PasswordForm, { email: "" });
    const user = userEvent.setup();

    const formItems = () =>
      within(document.getElementById("pw-requirements")!).getAllByRole(
        "listitem",
      );
    expect(formItems()).toHaveLength(3);
    await user.type(screen.getAllByLabelText(/^Password$/)[0], "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByTestId("sent")).toHaveTextContent("0");
    await rerender({ email: "alice@example.com" });
    expect(formItems()).toHaveLength(4);
  });

  it("does not announce each keystroke, then gives the count", async () => {
    vi.useFakeTimers();
    const { rerender } = render(PasswordRequirements, {
      value: "",
      requirements: [passwordRules.minLength(4), passwordRules.hasNumber()],
    });
    const status = () => screen.getByRole("status");

    await rerender({ value: "a" });
    await rerender({ value: "abcd" });
    await vi.advanceTimersByTimeAsync(900);
    expect(status().textContent?.trim()).toBe("");

    await vi.advanceTimersByTimeAsync(100);
    expect(status()).toHaveTextContent("1 of 2 requirements met");

    await rerender({ value: "abcd1" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(status()).toHaveTextContent("All requirements met");
  });

  it("keeps the status out of the element an input is described by", () => {
    const { container } = render(PasswordRequirements, { value: "x" });

    expect(
      container.querySelector(".bx--password-requirements"),
    ).not.toContainElement(screen.getByRole("status"));
  });
});

describe("PasswordInput with strength and requirements", () => {
  it("describes the input by the requirements and the strength", () => {
    render(PasswordForm);

    const input = screen.getAllByLabelText(/^Password$/)[0];
    const ids = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids).toEqual(
      expect.arrayContaining(["pw-requirements", "pw-strength"]),
    );
    expect(document.getElementById("pw-requirements")).toHaveTextContent(
      "Password requirements",
    );
  });

  it("blocks the submit and lists what is unmet in the error", async () => {
    const user = userEvent.setup();
    render(PasswordForm);

    await user.type(screen.getAllByLabelText(/^Password$/)[0], "hunter2");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByTestId("sent")).toHaveTextContent("0");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Password needs: at least 12 characters; not a commonly used password",
    );
    expect(screen.getAllByLabelText(/^Password$/)[0]).toBeInvalid();
    expect(
      document.querySelectorAll(".bx--password-requirements__item--invalid")
        .length,
    ).toBe(2);
  });

  it("submits a password that meets every requirement", async () => {
    const user = userEvent.setup();
    render(PasswordForm);

    await user.type(
      screen.getAllByLabelText(/^Password$/)[0],
      "lavender-sofa-7",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByTestId("sent")).toHaveTextContent("1");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects a password that contains the email's name", async () => {
    const user = userEvent.setup();
    render(PasswordForm);

    await user.type(
      screen.getAllByLabelText(/^Password$/)[0],
      "alice-loves-7-cats",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByTestId("sent")).toHaveTextContent("0");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "does not contain your name or email address",
    );
  });

  it("checks that the confirmation matches", async () => {
    const user = userEvent.setup();
    render(PasswordForm);

    await user.type(
      screen.getAllByLabelText(/^Password$/)[0],
      "lavender-sofa-7",
    );
    const confirm = screen.getByLabelText("Confirm password");
    await user.type(confirm, "lavender");
    expect(
      screen.getByRole("list", { name: "Confirmation" }),
    ).toHaveTextContent("Passwords match, not met");

    await user.type(confirm, "-sofa-7");
    expect(
      screen.getByRole("list", { name: "Confirmation" }),
    ).toHaveTextContent("Passwords match, met");
  });
});
