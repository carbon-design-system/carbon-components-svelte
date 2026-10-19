import {
  acquireBodyScrollLock,
  releaseBodyScrollLock,
} from "../../src/utils/body-scroll-lock.js";

const CLASS = "bx--body--with-modal-open";

describe("bodyScrollLock", () => {
  afterEach(() => {
    // Drain any leftover holders so each test starts from a clean count.
    while (document.body.classList.contains(CLASS)) {
      releaseBodyScrollLock();
    }
    document.body.classList.remove(CLASS);
  });

  it("ref-counts so the class persists until every holder releases", () => {
    expect(document.body).not.toHaveClass(CLASS);
    acquireBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);
    acquireBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);

    releaseBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);

    releaseBodyScrollLock();
    expect(document.body).not.toHaveClass(CLASS);
  });
});
