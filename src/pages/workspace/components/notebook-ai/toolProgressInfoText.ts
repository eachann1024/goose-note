import { createTranslator, i18nYaml } from "@/i18n";
import { formatNotebookAiError } from "@/lib/notebook-ai/errors";
import type { ProgressStep, ToolProgressPart } from "./toolProgressModel";
import { asString, readObject, truncate } from "./toolProgressValues";

const messages = i18nYaml<"src/pages/workspace/components/notebook-ai/toolProgressInfoText.ts#messages:1">`
zh-Hans:
  weather: "查询天气"
  exchange: "查询汇率"
  worldTime: "查看时间"
  querying: "正在查询"
  weatherDone: "{{place}} {{temp}}°，{{days}} 天预报"
  exchangeDone: "1 {{base}} = {{rate}} {{quote}}"
  worldTimeDone: "已显示 {{count}} 个地点的时间"
en:
  weather: "Weather"
  exchange: "Exchange rate"
  worldTime: "World time"
  querying: "Looking up"
  weatherDone: "{{place}} {{temp}}°, {{days}}-day forecast"
  exchangeDone: "1 {{base}} = {{rate}} {{quote}}"
  worldTimeDone: "Showing time for {{count}} places"
`;
const t = createTranslator(messages);

type StepText = Pick<ProgressStep, "label" | "detail">;

/** 「动作 · 对象」形式的步骤名；对象缺失时只留动作。 */
export function withSubject(action: string, subject: string) {
  return subject ? `${action} · ${truncate(subject)}` : action;
}

function placesOf(input: Record<string, unknown> | null) {
  const places = Array.isArray(input?.places) ? input.places : [];
  return places.map(place => typeof place === "string" ? place : asString(readObject(place)?.label)).filter(Boolean).join("、");
}

/** 天气 / 汇率 / 时间三类信息卡工具的步骤文案；其余工具返回 null。 */
export function getInfoToolStepText(part: ToolProgressPart): StepText | null {
  const input = readObject(part.input);
  const output = readObject(part.output);
  const error = asString(output?.error) || asString(part.errorText);

  if (part.type === "tool-getWeather") {
    const location = asString(input?.location);
    const current = readObject(output?.current);
    const place = asString(readObject(output?.location)?.name) || location;
    return {
      get label() { return withSubject(t("weather"), location); },
      get detail() {
        if (error) return formatNotebookAiError(error);
        if (!current) return t("querying");
        return t("weatherDone", { place, temp: Math.round(Number(current.temperature)), days: Array.isArray(output?.daily) ? output.daily.length : 0 });
      },
    };
  }

  if (part.type === "tool-getExchangeRate") {
    const pair = [asString(input?.from), asString(input?.to)].filter(Boolean).join(" → ");
    return {
      get label() { return withSubject(t("exchange"), pair); },
      get detail() {
        if (error) return formatNotebookAiError(error);
        if (typeof output?.rate !== "number") return t("querying");
        return t("exchangeDone", { base: asString(output.base), quote: asString(output.quote), rate: Number(output.rate.toPrecision(6)) });
      },
    };
  }

  if (part.type === "tool-getWorldTime") {
    const places = placesOf(input);
    return {
      get label() { return withSubject(t("worldTime"), places); },
      get detail() {
        if (error) return formatNotebookAiError(error);
        const entries = Array.isArray(output?.entries) ? output.entries.length : 0;
        return entries ? t("worldTimeDone", { count: entries }) : t("querying");
      },
    };
  }

  return null;
}
