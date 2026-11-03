// @vitest-environment node
import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
import { renderSSR } from "../utils/ssr";

describe("notification transition prop server render", () => {
  it.each([
    ["InlineNotification", InlineNotification, "bx--inline-notification"],
    ["ToastNotification", ToastNotification, "bx--toast-notification"],
  ] as const)(
    "%s renders the same markup with transition set",
    (_, component, className) => {
      const props = {
        title: "Saved",
        subtitle: "Your changes were saved.",
        kind: "success",
      };
      const plain = renderSSR(component as never, props as never).html;
      const animated = renderSSR(
        component as never,
        { ...props, transition: true } as never,
      ).html;

      expect(plain).toContain(className);
      expect(plain).toContain("Your changes were saved.");
      expect(animated).toBe(plain);
    },
  );
});
