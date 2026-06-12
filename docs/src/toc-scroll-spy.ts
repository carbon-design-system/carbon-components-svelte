export function setupTocScrollSpy(page: ParentNode): () => void {
  const sections: { id: string; section: HTMLElement }[] = [];
  const seen = new Set<string>();

  for (const link of page.querySelectorAll<HTMLAnchorElement>(
    '.toc-nav a[href^="#"]',
  )) {
    const id = link.getAttribute("href")?.slice(1);
    if (!id || seen.has(id)) continue;

    const section = page.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!section) continue;

    seen.add(id);
    sections.push({ id, section });
  }

  const linksById = new Map<string, HTMLAnchorElement[]>();

  for (const link of page.querySelectorAll<HTMLAnchorElement>(
    '.toc-nav a[href^="#"]',
  )) {
    const id = link.getAttribute("href")?.slice(1);
    if (!id) continue;

    const list = linksById.get(id) ?? [];
    list.push(link);
    linksById.set(id, list);
  }

  if (sections.length === 0) return () => {};

  function setActive(activeId: string) {
    for (const [id, links] of linksById) {
      const active = id === activeId;

      for (const link of links) {
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
  }

  const OFFSET = 48;
  let raf = 0;

  function update() {
    let activeId = sections[0].id;

    for (const { id, section } of sections) {
      if (section.getBoundingClientRect().top <= OFFSET) {
        activeId = id;
      }
    }

    setActive(activeId);
  }

  function scheduleUpdate() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);

    for (const links of linksById.values()) {
      for (const link of links) {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    }
  };
}
