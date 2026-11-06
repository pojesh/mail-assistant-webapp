/** How each AI category and sentiment looks. Colour is never the only signal: every chip
 * also has an icon and a text label (accessibility). */
import {
  AlertTriangle,
  CalendarClock,
  CircleDot,
  Flame,
  Frown,
  Info,
  Megaphone,
  Meh,
  Newspaper,
  Smile,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Schemas } from "@/lib/api/client";

export type Category = Schemas["InsightBrief"]["category"];
export type Sentiment = Schemas["InsightBrief"]["sentiment"];

type Meta = { label: string; icon: LucideIcon; className: string; dot: string };

export const CATEGORIES: Record<Category, Meta> = {
  action_required: {
    label: "Action",
    icon: Zap,
    className: "text-cat-action bg-cat-action/10 ring-cat-action/20",
    dot: "bg-cat-action",
  },
  meeting_request: {
    label: "Meeting",
    icon: CalendarClock,
    className: "text-cat-meeting bg-cat-meeting/10 ring-cat-meeting/20",
    dot: "bg-cat-meeting",
  },
  fyi: {
    label: "FYI",
    icon: Info,
    className: "text-cat-fyi bg-cat-fyi/10 ring-cat-fyi/20",
    dot: "bg-cat-fyi",
  },
  newsletter: {
    label: "Newsletter",
    icon: Newspaper,
    className: "text-cat-newsletter bg-cat-newsletter/10 ring-cat-newsletter/20",
    dot: "bg-cat-newsletter",
  },
  promotion: {
    label: "Promotion",
    icon: Megaphone,
    className: "text-cat-promotion bg-cat-promotion/10 ring-cat-promotion/20",
    dot: "bg-cat-promotion",
  },
  other: {
    label: "Other",
    icon: CircleDot,
    className: "text-cat-other bg-cat-other/10 ring-cat-other/20",
    dot: "bg-cat-other",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "action_required",
  "meeting_request",
  "fyi",
  "newsletter",
  "promotion",
  "other",
];

export const SENTIMENTS: Record<Sentiment, Meta> = {
  positive: {
    label: "Positive",
    icon: Smile,
    className: "text-success bg-success/10 ring-success/20",
    dot: "bg-success",
  },
  neutral: {
    label: "Neutral",
    icon: Meh,
    className: "text-muted-foreground bg-muted ring-border",
    dot: "bg-muted-foreground",
  },
  negative: {
    label: "Negative",
    icon: Frown,
    className: "text-warning bg-warning/10 ring-warning/20",
    dot: "bg-warning",
  },
  frustrated: {
    label: "Frustrated",
    icon: AlertTriangle,
    className: "text-destructive bg-destructive/10 ring-destructive/20",
    dot: "bg-destructive",
  },
  urgent: {
    label: "Urgent",
    icon: Flame,
    className: "text-destructive bg-destructive/10 ring-destructive/20",
    dot: "bg-destructive",
  },
};

export const AI_ICON = Sparkles;
