// @vitest-environment node

type Provider = { locale?: string; timeZone?: string };

/**
 * Renders as a server whose time zone is `serverZone`. Modules load again, so
 * a formatter that an earlier render cached for the runtime's zone does not
 * answer for this one.
 */
async function render(serverZone: string, provider?: Provider) {
  const previous = process.env.TZ;
  process.env.TZ = serverZone;
  vi.resetModules();
  try {
    const { renderSSR } = await import("../utils/ssr");
    const { default: SSR } = await import("./SSR.test.svelte");
    return renderSSR(SSR, { provider }).document;
  } finally {
    // Assigning `undefined` would set the string "undefined".
    Reflect.deleteProperty(process.env, "TZ");
    if (previous !== undefined) process.env.TZ = previous;
  }
}

const title = (document: Document) =>
  document.querySelector("time")?.getAttribute("title");

describe("LocaleProvider server render", () => {
  it("differs between two servers when the zone is left to the runtime", async () => {
    const tokyo = title(await render("Asia/Tokyo"));
    const newYork = title(await render("America/New_York"));
    expect(tokyo).not.toBe(newYork);
  });

  it("is the same on any server once the provider names the zone", async () => {
    const provider = { locale: "de-DE", timeZone: "Europe/Zurich" };
    const tokyo = await render("Asia/Tokyo", provider);
    const newYork = await render("America/New_York", provider);

    expect(title(tokyo)).toBe("13.09.2026, 13:55");
    expect(title(newYork)).toBe(title(tokyo));
    expect(tokyo.body.innerHTML).toBe(newYork.body.innerHTML);
  });

  it("writes the locale's text, number and direction into the markup", async () => {
    const { body } = await render("UTC", { locale: "de-DE", timeZone: "UTC" });
    expect(body.querySelector("time")?.textContent).toBe("vor 5 Minuten");
    expect(body.querySelector("input")?.getAttribute("value")).toBe("1.234,5");
    const wrapper = body.querySelector("[dir]");
    expect(wrapper).toHaveAttribute("dir", "ltr");
    expect(wrapper).toHaveAttribute("lang", "de-DE");
  });

  it("renders a right-to-left locale with dir rtl", async () => {
    const { body } = await render("UTC", { locale: "ar-EG", timeZone: "UTC" });
    expect(body.querySelector("[dir]")).toHaveAttribute("dir", "rtl");
  });
});
