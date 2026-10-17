import { useLocale, createTranslator, i18nYaml } from "@/i18n";
import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeftRight, Clock3, Globe, Sun } from "@/components/ui/icons";
import type { InfoCardData } from "@/lib/notebook-ai/cards/types";
import { cardVariants } from "./cardMotion";
import { WeatherCard } from "./WeatherCard";
import { ExchangeCard } from "./ExchangeCard";
import { WorldTimeCard } from "./WorldTimeCard";
import { WebResultsCard } from "./WebResultsCard";
import "./ai-cards.css";

const messages = i18nYaml<"src/pages/workspace/components/ai-cards/InfoCard.tsx#messages:1">`
zh-Hans:
  weather: "天气"
  exchange: "汇率"
  worldTime: "时间"
  webResults: "联网搜索"
en:
  weather: "Weather"
  exchange: "Exchange rate"
  worldTime: "Time"
  webResults: "Web search"
`;
const t = createTranslator(messages);

const ICONS = { weather: Sun, exchange: ArrowLeftRight, worldTime: Clock3, webResults: Globe } as const;

function cardTitle(card: InfoCardData) {
  if (card.kind === "webResults" && card.query) return `${t("webResults")} · ${card.query}`;
  return t(card.kind);
}

function cardSource(card: InfoCardData) {
  return card.kind === "worldTime" ? "" : card.source;
}

function CardBody({ card }: { card: InfoCardData }) {
  if (card.kind === "weather") return <WeatherCard card={card}/>;
  if (card.kind === "exchange") return <ExchangeCard card={card}/>;
  if (card.kind === "worldTime") return <WorldTimeCard card={card}/>;
  return <WebResultsCard card={card}/>;
}

/** 搜索回答与 AI 面板共用的信息卡：弹簧入场，内部行依次落定。 */
export const InfoCard = memo(function InfoCard({ card, className }: { card: InfoCardData; className?: string }) {
  useLocale();
  const reduce = useReducedMotion();
  const Icon = ICONS[card.kind];
  const source = cardSource(card);
  return <motion.section className={["ai-card", className].filter(Boolean).join(" ")} data-kind={card.kind} aria-label={cardTitle(card)}
    variants={cardVariants} initial={reduce ? false : "hidden"} animate="shown">
    <header className="ai-card-head">
      <Icon size={14} aria-hidden="true"/>
      <span className="ai-card-title">{cardTitle(card)}</span>
      {source && <span className="ai-card-source">{source}</span>}
    </header>
    <CardBody card={card}/>
  </motion.section>;
});
