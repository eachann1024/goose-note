import { listNotebooks, listPages, searchNotes, readPage } from "./notes";
import { showTable, showChart, showDiagram, showSvg } from "./visual";
import { loadSkill } from "./skills";
import { readWebPage, searchWeb } from "./web";
import { getWeather, getExchangeRate, getWorldTime } from "./cards";
import { executeBatchPlan } from "../batch-plan";

export const notebookAiTools = {
  loadSkill,
  searchWeb,
  readWebPage,
  getWeather,
  getExchangeRate,
  getWorldTime,
  listNotebooks,
  listPages,
  searchNotes,
  readPage,
  executeBatchPlan,
  showTable,
  showChart,
  showDiagram,
  showSvg,
} as const;

export type NotebookAiTools = typeof notebookAiTools;

export { loadSkill };
export { searchWeb, readWebPage };
export { getWeather, getExchangeRate, getWorldTime };
export { listNotebooks, listPages, searchNotes, readPage };
export { executeBatchPlan };
export { showTable, showChart, showDiagram, showSvg };
