import { createTranslator, i18nYaml } from "@/i18n";
import type { SheetStep } from "./sheetAnswerState";

const messages = i18nYaml<"src/pages/workspace/components/search-sheet/sheetStepText.ts#messages:1">`
zh-Hans:
  understand: "理解问题"
  retrieve: "检索笔记"
  retrieveFound: "找到 {{count}} 篇相关笔记"
  retrieveNone: "没有直接相关的摘录"
  thinking: "思考"
  searchNotes: "搜索笔记"
  readPage: "阅读笔记"
  listPages: "查看页面列表"
  searchWeb: "联网搜索"
  readWebPage: "读取网页"
  getWeather: "查询天气"
  getExchangeRate: "查询汇率"
  getWorldTime: "查看时间"
  composeRunning: "正在组织回答"
  compose: "组织回答"
  tool: "调用工具"
  found: "{{count}} 条"
  noResults: "无结果"
  failed: "失败"
  summary: "已完成 {{count}} 步"
  summaryNotes: "阅读 {{count}} 篇笔记"
  summaryWeb: "联网 {{count}} 次"
  summaryFailed: "{{count}} 步失败"
en:
  understand: "Understand the question"
  retrieve: "Search notes"
  retrieveFound: "Found {{count}} related notes"
  retrieveNone: "No directly related excerpts"
  thinking: "Thinking"
  searchNotes: "Search notes"
  readPage: "Read note"
  listPages: "List notes"
  searchWeb: "Search the web"
  readWebPage: "Read web page"
  getWeather: "Check weather"
  getExchangeRate: "Check exchange rate"
  getWorldTime: "Check time"
  composeRunning: "Writing the answer"
  compose: "Write the answer"
  tool: "Use tool"
  found: "{{count}} results"
  noResults: "No results"
  failed: "Failed"
  summary: "{{count}} steps done"
  summaryNotes: "read {{count}} notes"
  summaryWeb: "{{count}} web searches"
  summaryFailed: "{{count}} failed"
`;
const t = createTranslator(messages);

const TOOL_LABELS = ["searchNotes", "readPage", "listPages", "searchWeb", "readWebPage", "getWeather", "getExchangeRate", "getWorldTime"] as const;
type ToolLabel = (typeof TOOL_LABELS)[number];
const isToolLabel = (name: string): name is ToolLabel => (TOOL_LABELS as readonly string[]).includes(name);

/** 步骤名：「动作 · 对象」；笔记标题加书名号，检索词加引号。 */
export function stepLabel(step: SheetStep) {
  if (step.name === "understand") return t("understand");
  if (step.name === "retrieve") return t("retrieve");
  if (step.name === "thinking") return t("thinking");
  if (step.name === "compose") return step.status === "running" ? t("composeRunning") : t("compose");
  const action = isToolLabel(step.name) ? t(step.name) : t("tool");
  if (!step.subject) return action;
  const subject = step.subject.length > 32 ? `${step.subject.slice(0, 31)}…` : step.subject;
  if (step.name === "readPage") return `${action}《${subject}》`;
  if (step.name === "searchNotes" || step.name === "searchWeb") return `${action}「${subject}」`;
  return `${action} · ${subject}`;
}

/** 步骤右侧的结果：数量、失败。 */
export function stepResult(step: SheetStep) {
  if (step.status === "error") return t("failed");
  if (step.status !== "done" || step.count === undefined) return "";
  if (step.name === "retrieve") return step.count ? t("retrieveFound", { count: step.count }) : t("retrieveNone");
  return step.count ? t("found", { count: step.count }) : t("noResults");
}

/** 完成后折叠成一行：已完成 N 步 · 阅读 X 篇笔记 · 联网 Y 次。 */
export function stepsSummary(steps: SheetStep[]) {
  const visible = steps.filter(step => step.name !== "compose");
  const notes = steps.filter(step => step.name === "readPage" && step.status === "done").length;
  const web = steps.filter(step => step.name === "searchWeb" && step.status === "done").length;
  const failed = steps.filter(step => step.status === "error").length;
  return [
    t("summary", { count: visible.length }),
    notes ? t("summaryNotes", { count: notes }) : "",
    web ? t("summaryWeb", { count: web }) : "",
    failed ? t("summaryFailed", { count: failed }) : "",
  ].filter(Boolean).join(" · ");
}
