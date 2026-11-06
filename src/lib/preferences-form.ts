/**
 * The preferences form: one zod schema shared by onboarding and the Preferences page.
 * Times are "HH:MM" in the form and "HH:MM:SS" in the API, converted by toForm / toApi.
 */
import { z } from "zod";

import type { Schemas } from "@/lib/api/client";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const clock = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");
const range = z
  .object({ start: clock, end: clock })
  .refine((value) => value.end > value.start, { message: "End must be after start", path: ["end"] });
const email = z.string().trim().toLowerCase().email("Not a valid email address");
const domain = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^@/, ""))
  .pipe(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Not a valid domain"));

export const preferencesSchema = z.object({
  tone: z.string().trim().min(2, "Describe your tone in a few words").max(200),
  language: z.string().trim().min(2).max(64),
  sign_off: z.string().trim().max(100),
  signature: z.string().max(2000),
  timezone: z.string().min(1, "Choose your timezone"),
  vip_senders: z.array(z.string().trim().toLowerCase()).max(200),
  meeting: z.object({
    working_days: z.array(z.enum(WEEKDAYS)).min(1, "Pick at least one working day"),
    working_hours: range,
    no_meeting_days: z.array(z.enum(WEEKDAYS)),
    focus_blocks: z.array(range.and(z.object({ day: z.enum(WEEKDAYS) }))).max(20),
    lunch_enabled: z.boolean(),
    lunch_break: range,
    buffer_minutes: z.number().int().min(0).max(60),
    min_notice_hours: z.number().int().min(0).max(72),
    max_meetings_per_day: z.number().int().min(1).max(20),
    search_horizon_days: z.number().int().min(1).max(30),
    preferred_times: z.array(z.enum(["morning", "afternoon", "evening"])),
    default_duration_minutes: z.number().int().min(15).max(240),
    add_video_link: z.boolean(),
    auto_schedule: z.enum(["off", "trusted", "all"]),
    trusted_domains: z.array(domain).max(50),
    auto_actions_per_day: z.number().int().min(0).max(20),
    undo_window_hours: z.number().int().min(1).max(72),
    vip_can_override_focus: z.boolean(),
  }),
});

export type PreferencesForm = z.infer<typeof preferencesSchema>;
export const emailSchema = email;
export const domainSchema = domain;

const toClock = (time: string) => time.slice(0, 5);
const toTime = (value: string) => `${value}:00`;

/** API -> form values. */
export function toForm(api: Schemas["PreferencesBody"]): PreferencesForm {
  const meeting = api.meeting_preferences as Schemas["MeetingPreferences"];
  return {
    tone: api.tone,
    language: api.language,
    sign_off: api.sign_off,
    signature: api.signature,
    timezone: api.timezone,
    vip_senders: api.vip_senders ?? [],
    meeting: {
      working_days: meeting.working_days,
      working_hours: { start: toClock(meeting.working_hours.start), end: toClock(meeting.working_hours.end) },
      no_meeting_days: meeting.no_meeting_days,
      focus_blocks: meeting.focus_blocks.map((block) => ({
        day: block.day,
        start: toClock(block.start),
        end: toClock(block.end),
      })),
      lunch_enabled: meeting.lunch_break !== null,
      lunch_break: meeting.lunch_break
        ? { start: toClock(meeting.lunch_break.start), end: toClock(meeting.lunch_break.end) }
        : { start: "13:00", end: "14:00" },
      buffer_minutes: meeting.buffer_minutes,
      min_notice_hours: meeting.min_notice_hours,
      max_meetings_per_day: meeting.max_meetings_per_day,
      search_horizon_days: meeting.search_horizon_days,
      preferred_times: meeting.preferred_times,
      default_duration_minutes: meeting.default_duration_minutes,
      add_video_link: meeting.add_video_link,
      auto_schedule: meeting.auto_schedule,
      trusted_domains: meeting.trusted_domains,
      auto_actions_per_day: meeting.auto_actions_per_day,
      undo_window_hours: meeting.undo_window_hours,
      vip_can_override_focus: meeting.vip_can_override_focus,
    },
  };
}

/** Form values -> API body for PUT /api/preferences. */
export function toApi(form: PreferencesForm): Schemas["PreferencesBody"] {
  const { meeting } = form;
  return {
    tone: form.tone,
    language: form.language,
    sign_off: form.sign_off,
    signature: form.signature,
    timezone: form.timezone,
    vip_senders: form.vip_senders,
    meeting_preferences: {
      working_days: meeting.working_days,
      working_hours: { start: toTime(meeting.working_hours.start), end: toTime(meeting.working_hours.end) },
      no_meeting_days: meeting.no_meeting_days,
      focus_blocks: meeting.focus_blocks.map((block) => ({
        day: block.day,
        start: toTime(block.start),
        end: toTime(block.end),
      })),
      lunch_break: meeting.lunch_enabled
        ? { start: toTime(meeting.lunch_break.start), end: toTime(meeting.lunch_break.end) }
        : null,
      buffer_minutes: meeting.buffer_minutes,
      min_notice_hours: meeting.min_notice_hours,
      max_meetings_per_day: meeting.max_meetings_per_day,
      search_horizon_days: meeting.search_horizon_days,
      preferred_times: meeting.preferred_times,
      default_duration_minutes: meeting.default_duration_minutes,
      add_video_link: meeting.add_video_link,
      auto_schedule: meeting.auto_schedule,
      trusted_domains: meeting.trusted_domains,
      auto_actions_per_day: meeting.auto_actions_per_day,
      undo_window_hours: meeting.undo_window_hours,
      vip_can_override_focus: meeting.vip_can_override_focus,
    },
  };
}

/** Every IANA timezone the browser knows, with the user's own first. */
export function timezones(): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];
  return Array.from(new Set(["UTC", ...all]));
}

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
