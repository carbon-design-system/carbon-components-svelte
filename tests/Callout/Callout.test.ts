import { render, screen } from "@testing-library/svelte";
import CalloutComponent from "carbon-components-svelte/Notification/Callout.svelte";
import { user } from "../utils/user";
import Callout from "./Callout.test.svelte";
import CalloutSlots from "./CalloutSlots.test.svelte";

const kinds = [
  ["error", "Error"],
  ["info", "Information"],
  ["info-square", "Information"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["warning-alt", "Warning"],
] as const;

const root = "bx--inline-notification";

describe("Callout", () => {
  it("renders a static info notice with no live region or close button", () => {
    render(Callout);

    const callout = screen.getByTestId("callout");
    expect(callout).toHaveClass(
      root,
      `${root}--callout`,
      `${root}--info`,
      `${root}--high-contrast`,
      `${root}--hide-close-button`,
    );
    expect(callout).not.toHaveAttribute("role");
    expect(callout).not.toHaveAttribute("aria-live");
    expect(callout.querySelector("[role], [aria-live]")).toBe(
      callout.querySelector(`.${root}__icon`),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each(
    kinds.flatMap(([kind]) =>
      [false, true].map((lowContrast) => ({ kind, lowContrast })),
    ),
  )(
    "marks kind=$kind lowContrast=$lowContrast on the root and icon",
    ({ kind, lowContrast }) => {
      render(Callout, { props: { kind, lowContrast } });

      const callout = screen.getByTestId("callout");
      expect(callout).toHaveClass(`${root}--${kind}`);
      expect(callout).toHaveClass(
        `${root}--${lowContrast ? "low" : "high"}-contrast`,
      );
      expect(callout).not.toHaveClass(
        `${root}--${lowContrast ? "high" : "low"}-contrast`,
      );
      expect(
        [...callout.classList].filter((name) =>
          name.startsWith(`${root}--low-contrast-`),
        ),
      ).toEqual(lowContrast ? [`${root}--low-contrast-${kind}`] : []);
      expect(callout.querySelector(`.${root}__icon`)).toHaveClass(
        `${root}__icon--${lowContrast ? "low-contrast-" : ""}${kind}`,
      );
    },
  );

  it.each(kinds)("labels the %s icon %s", (kind, label) => {
    render(Callout, { props: { kind } });

    expect(screen.getByRole("img", { name: label })).toHaveClass(
      `${root}__icon`,
    );
  });

  it("labels the icon with statusIconDescription", () => {
    render(Callout, {
      props: { kind: "warning", statusIconDescription: "Avertissement" },
    });

    expect(screen.getByRole("img", { name: "Avertissement" })).toBeVisible();
  });

  it("gives the title its titleId", () => {
    render(Callout, {
      props: { title: "Scheduled downtime", subtitle: "Tonight, 22:00 UTC" },
    });

    const title = document.getElementById("callout-title");
    expect(title).toHaveClass(`${root}__title`);
    expect(title).toHaveTextContent("Scheduled downtime");
    expect(screen.getByText("Tonight, 22:00 UTC")).toHaveClass(
      `${root}__subtitle`,
    );
  });

  it("generates a title id by default", () => {
    render(CalloutComponent, { props: { title: "Scheduled downtime" } });

    expect(document.querySelector(`.${root}__title`)?.id).toMatch(/^ccs-/);
  });

  it("renders no title or subtitle element when both are empty", () => {
    render(Callout, { props: { title: "", subtitle: "" } });

    expect(document.querySelector(`.${root}__title`)).toBeNull();
    expect(document.querySelector(`.${root}__subtitle`)).toBeNull();
  });

  it("describes an action button by the title", () => {
    render(Callout, { props: { action: true } });

    expect(
      screen.getByRole("button", {
        name: "View schedule",
        description: "Scheduled downtime",
      }),
    ).toHaveClass(`${root}__action-button`);
  });

  it("joins a consumer aria-describedby after the title id", () => {
    render(Callout, {
      props: { action: true, actionDescribedBy: "maintenance-note" },
    });

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-describedby",
      "callout-title maintenance-note",
    );
  });

  it("does not describe the action by a missing title", () => {
    render(Callout, { props: { action: true, title: "" } });

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
  });

  it("renders the title, subtitle and default slots", () => {
    render(CalloutSlots);

    const title = document.getElementById("quota-title");
    expect(title).toHaveClass(`${root}__title`);
    expect(title).toHaveTextContent("Storage almost full");
    expect(
      screen.getByRole("link", {
        name: "Upgrade your plan",
        description: "Storage almost full",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("extra")).toHaveTextContent(
      "Older builds are removed first.",
    );
  });

  it("sets the full width class", () => {
    render(Callout, { props: { fullWidth: true } });

    expect(screen.getByTestId("callout")).toHaveClass(`${root}--full-width`);
  });

  it("forwards click", async () => {
    const onclick = vi.fn();
    render(Callout, { props: { onclick } });

    await user.click(screen.getByText("Scheduled downtime"));

    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
