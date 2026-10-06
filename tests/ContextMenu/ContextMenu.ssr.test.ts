// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ContextMenu from "./ContextMenuSsr.test.svelte";

describe("ContextMenu server render", () => {
  it.each([false, true])(
    "marks each option's menu level without a DOM ref (open: %s)",
    (open) => {
      const { document } = renderSSR(ContextMenu, { open });
      const nested = (label: string) =>
        [...document.querySelectorAll("li")]
          .find(
            (item) =>
              item.getAttribute("role") === "menuitem" &&
              item.textContent?.trim() === label,
          )
          ?.getAttribute("data-nested");

      expect(nested("Copy")).toBe("false");
      expect(nested("Nested")).toBe("true");
    },
  );
});
