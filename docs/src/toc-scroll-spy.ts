export function setupTocScrollSpy(page: ParentNode): () => void {
  const sections: { id: string; section: HTMLElement }[] = [];
  const linksById = new Map<string, HTMLAnchorElement[]>();
  const seen = new Set<string>();

  for (const link of page.querySelectorAll<HTMLAnchorElement>(
    '.toc-nav a[href^="#"]',
  )) {
    const id = link.getAttribute("href")?.slice(1);
    if (!id) continue;

    const list = linksById.get(id) ?? [];
    list.push(link);
    linksById.set(id, list);

    if (seen.has(id)) continue;

    const section = page.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!section) continue;

    seen.add(id);
    sections.push({ id, section });
  }

  if (sections.length === 0) return () => {};

  let currentActiveId = "";

  // `scrollIntoView` would also scroll the page when the container reaches
  // past the window, moving it off a restored scroll position.
  function scrollTocLinkIntoViewIfNeeded(link: HTMLAnchorElement) {
    // Skip the hidden mobile/desktop clone; only the rendered copy has a box.
    if (link.offsetParent === null) return;

    const container = link.closest<HTMLElement>(".table__scroll");
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const inView =
      linkRect.top >= containerRect.top &&
      linkRect.bottom <= containerRect.bottom;

    if (!inView) {
      container.scrollTop +=
        linkRect.top -
        containerRect.top -
        (container.clientHeight - linkRect.height) / 2;
    }
  }

  function setActive(activeId: string) {
    if (activeId === currentActiveId) return;
    currentActiveId = activeId;

    for (const [id, links] of linksById) {
      const active = id === activeId;

      for (const link of links) {
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "location");
          scrollTocLinkIntoViewIfNeeded(link);
        } else {
          link.removeAttribute("aria-current");
        }
      }
    }
  }

  // Matches `scroll-margin-top: 3rem`.
  const HEADER_HEIGHT = 48;
  // A clicked section can land at 48.3 from sub-pixel rounding.
  const OFFSET = HEADER_HEIGHT + 1;
  let raf = 0;

  function update() {
    const tops = sections.map(
      ({ section }) => section.getBoundingClientRect().top,
    );

    let activeId = sections[0].id;

    for (let i = 0; i < sections.length; i++) {
      if (tops[i] <= OFFSET) {
        activeId = sections[i].id;
      }
    }

    // Short trailing sections never reach OFFSET.
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 1;

    if (atBottom) {
      for (let i = 0; i < sections.length; i++) {
        if (tops[i] <= window.innerHeight) {
          activeId = sections[i].id;
        }
      }
    }

    setActive(activeId);
  }

  function scheduleUpdate() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }

  const clickHandlers: { link: HTMLAnchorElement; handler: () => void }[] = [];

  for (const [id, links] of linksById) {
    for (const link of links) {
      const handler = () => setActive(id);
      link.addEventListener("click", handler);
      clickHandlers.push({ link, handler });
    }
  }

  update();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);

    for (const { link, handler } of clickHandlers) {
      link.removeEventListener("click", handler);
    }

    for (const links of linksById.values()) {
      for (const link of links) {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    }
  };
}
