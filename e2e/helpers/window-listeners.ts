import type { Page } from "@playwright/test";

type WindowWithListenerCounter = Window & {
  __netClickListeners: () => number;
};

export async function installClickListenerCounter(page: Page) {
  await page.addInitScript(() => {
    const net = { click: 0 };
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = (type, listener, options) => {
      if (type === "click") net.click++;
      return add(type, listener, options);
    };
    window.removeEventListener = (type, listener, options) => {
      if (type === "click") net.click--;
      return remove(type, listener, options);
    };
    (window as WindowWithListenerCounter).__netClickListeners = () => net.click;
  });
}

export function netClickListeners(page: Page) {
  return page.evaluate(() =>
    (window as WindowWithListenerCounter).__netClickListeners(),
  );
}
