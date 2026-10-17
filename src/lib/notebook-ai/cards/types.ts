/** AI 信息卡片的数据契约：工具返回这些结构，搜索回答与 AI 面板共用同一套卡片组件渲染。 */

export type WeatherDay = {
  /** YYYY-MM-DD，地点当地日期 */
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  /** 0-100，可能缺失 */
  precipitationProbability: number | null;
};

export type WeatherCardData = {
  kind: "weather";
  location: { name: string; region?: string; country?: string; timezone: string };
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  /** 今天起最多 7 天 */
  daily: WeatherDay[];
  units: { temperature: string; windSpeed: string };
  source: string;
  fetchedAt: string;
};

export type ExchangeCardData = {
  kind: "exchange";
  base: string;
  quote: string;
  amount: number;
  rate: number;
  converted: number;
  /** 汇率日期 YYYY-MM-DD */
  date: string;
  /** 近 30 天走势，可能为空 */
  history: Array<{ date: string; rate: number }>;
  source: string;
};

export type WorldTimeCardData = {
  kind: "worldTime";
  /** 卡片按 timeZone 在本地实时走秒 */
  entries: Array<{ label: string; timeZone: string }>;
};

export type WebResultsCardData = {
  kind: "webResults";
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
  source: string;
};

export type InfoCardData = WeatherCardData | ExchangeCardData | WorldTimeCardData | WebResultsCardData;

export const CARD_TOOL_NAMES = ["getWeather", "getExchangeRate", "getWorldTime"] as const;
export type CardToolName = (typeof CARD_TOOL_NAMES)[number];

/** 从任意工具输出里识别卡片数据；searchWeb 的结果转成网页来源卡。 */
export function toInfoCard(toolName: string, output: unknown): InfoCardData | null {
  if (!output || typeof output !== "object") return null;
  const record = output as Record<string, unknown>;
  if ("error" in record && record.error) return null;
  if (toolName === "searchWeb") {
    const results = Array.isArray(record.results) ? (record.results as WebResultsCardData["results"]) : [];
    if (results.length === 0) return null;
    return { kind: "webResults", query: String(record.query ?? ""), results, source: String(record.source ?? "") };
  }
  const kind = record.kind;
  if (kind === "weather" || kind === "exchange" || kind === "worldTime") return output as InfoCardData;
  return null;
}
