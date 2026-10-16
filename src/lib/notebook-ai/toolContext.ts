import { z } from "zod";
import type { NotebookAiAgentContext } from "./types";

// Preserve the shared Set: loadSkill must unlock tools for the next agent step.
// An object/set schema would clone it during validation.
export const notebookAiAgentContextSchema = z.custom<NotebookAiAgentContext>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "notebookId" in value &&
    typeof value.notebookId === "string" &&
    "loadedSkills" in value &&
    value.loadedSkills instanceof Set &&
    (!("currentPageId" in value) ||
      value.currentPageId == null ||
      typeof value.currentPageId === "string"),
  "Missing notebook AI tool context",
);
