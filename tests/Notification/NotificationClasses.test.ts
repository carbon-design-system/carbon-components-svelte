import { render } from "@testing-library/svelte";
import InlineNotificationTest from "../InlineNotification/InlineNotification.test.svelte";
import ToastNotificationTest from "../ToastNotification/ToastNotification.test.svelte";

const kinds = [
  "error",
  "info",
  "info-square",
  "success",
  "warning",
  "warning-alt",
] as const;

const matrix = kinds.flatMap((kind) =>
  [false, true].map((lowContrast) => ({ kind, lowContrast })),
);

describe.each([
  {
    name: "ToastNotification",
    Fixture: ToastNotificationTest,
    root: "bx--toast-notification",
  },
  {
    name: "InlineNotification",
    Fixture: InlineNotificationTest,
    root: "bx--inline-notification",
  },
])("$name variant classes", ({ Fixture, root }) => {
  it.each(matrix)(
    "should mark kind=$kind lowContrast=$lowContrast on the root, icon and close icon",
    ({ kind, lowContrast }) => {
      render(Fixture, { props: { kind, lowContrast } });

      const notification = document.querySelector(`.${root}`);
      expect(notification).toHaveClass(`${root}--${kind}`);
      expect(notification).toHaveClass(
        `${root}--${lowContrast ? "low" : "high"}-contrast`,
      );
      expect(notification).not.toHaveClass(
        `${root}--${lowContrast ? "high" : "low"}-contrast`,
      );
      expect(
        [...(notification?.classList ?? [])].filter((name) =>
          name.startsWith(`${root}--low-contrast-`),
        ),
      ).toEqual(lowContrast ? [`${root}--low-contrast-${kind}`] : []);

      const icon = document.querySelector(`.${root}__icon`);
      const marker = `${root}__icon--${lowContrast ? "low-contrast-" : ""}${kind}`;
      expect(icon).toHaveClass(marker);
      expect(
        [...(icon?.classList ?? [])].filter((name) =>
          name.startsWith(`${root}__icon--`),
        ),
      ).toEqual([marker]);

      const closeIcon = document.querySelector(`.${root}__close-icon`);
      expect(
        closeIcon?.classList.contains(`${root}__close-icon--low-contrast`),
      ).toBe(lowContrast);
    },
  );
});
