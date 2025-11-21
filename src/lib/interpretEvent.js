import { EVENT_PATTERNS } from "./eventDictionary";
import { prettifyEventKey } from "./prettifyEventKey";

export function interpretEvent(eventType) {
  const key = String(eventType || "").toLowerCase();

  for (const rule of EVENT_PATTERNS) {
    if (rule.match.test(key)) {
      return {
        title: rule.title || prettifyEventKey(eventType),
        tone: rule.tone,
        icon: rule.icon,
        rawLabel: prettifyEventKey(eventType),
      };
    }
  }

  return {
    title: prettifyEventKey(eventType),
    tone: "neutral",
    icon: "alert",
    rawLabel: prettifyEventKey(eventType),
  };
}
