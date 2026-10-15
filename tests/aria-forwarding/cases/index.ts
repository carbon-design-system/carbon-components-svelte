import type { AriaEntry } from "../contract";
import { forms } from "./forms";
import { interactive } from "./interactive";
import { navigation } from "./navigation";

export const entries: AriaEntry[] = [...forms, ...interactive, ...navigation];
