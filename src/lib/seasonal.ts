/**
 * Rule-based seasonal demand insight — no ML, just a lookup table of
 * India-centric hospitality demand patterns by month and resource type.
 */
const SEASONAL_INSIGHTS: Record<string, Partial<Record<number, string>>> = {
  BANQUET_SPACE: {
    10: "Wedding season is starting — banquet space demand typically rises through Nov–Feb.",
    11: "Peak wedding season — banquet halls are in high demand this month.",
    0: "Peak wedding season — banquet halls are in high demand this month.",
    1: "Wedding season continues — good time to keep your space listed and priced competitively.",
  },
  PARKING: {
    9: "Festival season (Navratri/Diwali) drives short-term parking demand spikes.",
    10: "Diwali season — expect higher demand for event parking.",
  },
  VEHICLE: {
    9: "Festive travel season — vehicle rental demand tends to rise.",
    3: "Summer travel season approaching — vehicle demand typically increases.",
    4: "Summer travel season — vehicle demand typically peaks.",
  },
  KITCHEN: {
    10: "Catering demand rises with wedding/festival season — consider listing spare kitchen capacity.",
    11: "Catering demand rises with wedding/festival season — consider listing spare kitchen capacity.",
  },
  AV_EQUIPMENT: {
    10: "Event season ramping up — AV equipment requests typically increase through winter.",
    11: "Peak event season for AV equipment rentals.",
  },
  FURNITURE: {
    10: "Event season drives furniture rental demand (seating, tables, decor).",
  },
};

/** month: 0-11 (JS Date getMonth()) */
export function getSeasonalInsight(resourceType: string, month: number): string | null {
  return SEASONAL_INSIGHTS[resourceType]?.[month] ?? null;
}
