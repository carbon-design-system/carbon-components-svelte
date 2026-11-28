/**
 * The dev server's entry for framed examples (`framed.html`): Bun bundles
 * each HTML page on its first request, so the site's page compiles none
 * of the framed examples, and an iframe compiles them when it first
 * loads. The build serves framed paths from `index.html`.
 */
import "../../css/all.css";
import "../../css/prose.css";
import "../../css/syntax-tokens.css";
import "../../css/syntax.css";
import "./global.css";
import { normalizePath } from "./routes";
import { startFramed } from "./start-framed";

startFramed(normalizePath(window.location.pathname));
