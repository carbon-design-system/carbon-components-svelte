/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { userEvent } from "@testing-library/user-event";
import "../css/all.css";

// Mock scrollIntoView since it's not implemented in JSDOM
Element.prototype.scrollIntoView = vi.fn();

export const user = userEvent.setup();
