/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { userEvent } from "@testing-library/user-event";
import "../css/all.css";

export const user = userEvent.setup();
