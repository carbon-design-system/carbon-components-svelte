import {
  acquireBodyScrollLock,
  releaseBodyScrollLock,
} from "../../src/utils/bodyScrollLock.js";

const CLASS = "bx--body--with-modal-open";

describe("bodyScrollLock", () => {
  afterEach(() => {
    // Drain any leftover holders so each test starts from a clean count.
    while (document.body.classList.contains(CLASS)) {
      releaseBodyScrollLock();
    }
    document.body.classList.remove(CLASS);
  });

  test("adds the class on first acquire and removes on last release", () => {
    expect(document.body).not.toHaveClass(CLASS);
    acquireBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);
    releaseBodyScrollLock();
    expect(document.body).not.toHaveClass(CLASS);
  });

  test("ref-counts so the class persists until every holder releases", () => {
    acquireBodyScrollLock();
    acquireBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);

    releaseBodyScrollLock();
    expect(document.body).toHaveClass(CLASS);

    releaseBodyScrollLock();
    expect(document.body).not.toHaveClass(CLASS);
  });

  test("ignores releases when no lock is held", () => {
    releaseBodyScrollLock();
    expect(document.body).not.toHaveClass(CLASS);
  });
});
