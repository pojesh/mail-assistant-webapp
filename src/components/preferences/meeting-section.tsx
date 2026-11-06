"use client";

import { Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { DayToggles, NumberStepper, TimeRangeInput, TimezonePicker } from "@/components/forms/inputs";
import { SettingRow } from "@/components/preferences/setting-row";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WEEKDAYS, WEEKDAY_LABELS, type PreferencesForm } from "@/lib/preferences-form";
import { cn } from "@/lib/utils";

const TIMES_OF_DAY = [
  { value: "morning", label: "Morning", hint: "before 12:00" },
  { value: "afternoon", label: "Afternoon", hint: "12:00–17:00" },
  { value: "evening", label: "Evening", hint: "after 17:00" },
] as const;
const DURATIONS = [15, 30, 45, 60, 90];

function FocusBlocks() {
  const { control, formState } = useFormContext<PreferencesForm>();
  const { fields, append, remove } = useFieldArray({ control, name: "meeting.focus_blocks" });
  const blockErrors = formState.errors.meeting?.focus_blocks;
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <Controller
              control={control}
              name={`meeting.focus_blocks.${index}.day`}
              render={({ field: dayField }) => (
                <Select value={dayField.value} onValueChange={dayField.onChange}>
                  <SelectTrigger className="h-8 w-24" aria-label="Day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {WEEKDAY_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name={`meeting.focus_blocks.${index}`}
              render={({ field: blockField }) => (
                <TimeRangeInput
                  label="Focus block"
                  value={{ start: blockField.value.start, end: blockField.value.end }}
                  onChange={(range) => blockField.onChange({ ...blockField.value, ...range })}
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove focus block"
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
            {blockErrors?.[index] && (
              <p className="w-full text-xs text-destructive">End must be after start</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ day: "mon", start: "09:30", end: "11:30" })}
      >
        <Plus /> Add focus block
      </Button>
    </div>
  );
}

/** Hard rules (never broken by automatic actions) and soft preferences for meetings. */
export function MeetingSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<PreferencesForm>();
  const lunchEnabled = useWatch<PreferencesForm, "meeting.lunch_enabled">({ name: "meeting.lunch_enabled" });
  const meetingErrors = errors.meeting;

  return (
    <>
      <SettingRow
        label="Timezone"
        description="All times are shown and checked in this timezone."
        error={errors.timezone?.message}
      >
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => <TimezonePicker value={field.value} onChange={field.onChange} />}
        />
      </SettingRow>
      <SettingRow label="Working days" error={meetingErrors?.working_days?.message}>
        <Controller
          control={control}
          name="meeting.working_days"
          render={({ field }) => <DayToggles value={field.value} onChange={field.onChange} />}
        />
      </SettingRow>
      <SettingRow
        label="Working hours"
        description="Meetings must start and end inside these hours."
        error={meetingErrors?.working_hours?.end?.message}
      >
        <Controller
          control={control}
          name="meeting.working_hours"
          render={({ field }) => (
            <TimeRangeInput label="Working hours" value={field.value} onChange={field.onChange} />
          )}
        />
      </SettingRow>
      <SettingRow label="No-meeting days" description="Working days that stay free of meetings.">
        <Controller
          control={control}
          name="meeting.no_meeting_days"
          render={({ field }) => <DayToggles tone="muted" value={field.value} onChange={field.onChange} />}
        />
      </SettingRow>
      <SettingRow label="Lunch break" error={meetingErrors?.lunch_break?.end?.message}>
        <div className="flex flex-wrap items-center gap-3">
          <Controller
            control={control}
            name="meeting.lunch_enabled"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Keep lunch free" />
            )}
          />
          <div className={cn("transition-opacity", !lunchEnabled && "pointer-events-none opacity-40")}>
            <Controller
              control={control}
              name="meeting.lunch_break"
              render={({ field }) => (
                <TimeRangeInput label="Lunch" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </SettingRow>
      <SettingRow label="Focus blocks" description="Deep-work time that meetings never go into.">
        <FocusBlocks />
      </SettingRow>
      <SettingRow label="Buffer between meetings">
        <Controller
          control={control}
          name="meeting.buffer_minutes"
          render={({ field }) => (
            <NumberStepper
              ariaLabel="buffer"
              unit="minutes"
              min={0}
              max={60}
              step={5}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </SettingRow>
      <SettingRow label="Minimum notice" description="No meetings sooner than this from now.">
        <Controller
          control={control}
          name="meeting.min_notice_hours"
          render={({ field }) => (
            <NumberStepper
              ariaLabel="minimum notice"
              unit="hours"
              min={0}
              max={72}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </SettingRow>
      <SettingRow label="Meetings per day" description="The daily maximum.">
        <Controller
          control={control}
          name="meeting.max_meetings_per_day"
          render={({ field }) => (
            <NumberStepper
              ariaLabel="meetings per day"
              min={1}
              max={20}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </SettingRow>
      <SettingRow label="Look ahead" description="How far ahead to search for free times.">
        <Controller
          control={control}
          name="meeting.search_horizon_days"
          render={({ field }) => (
            <NumberStepper
              ariaLabel="search horizon"
              unit="days"
              min={1}
              max={30}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </SettingRow>
      <SettingRow label="Preferred times" description="Soft preference used to rank suggestions.">
        <Controller
          control={control}
          name="meeting.preferred_times"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {TIMES_OF_DAY.map((time) => {
                const on = field.value.includes(time.value);
                return (
                  <button
                    key={time.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      field.onChange(
                        on
                          ? field.value.filter((value) => value !== time.value)
                          : [...field.value, time.value],
                      )
                    }
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-left text-xs transition-all active:scale-95",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <span className="block font-medium">{time.label}</span>
                    <span className="opacity-80">{time.hint}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </SettingRow>
      <SettingRow label="Default length" description="Used when the email does not say.">
        <Controller
          control={control}
          name="meeting.default_duration_minutes"
          render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
              <SelectTrigger className="w-36" aria-label="Default meeting length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </SettingRow>
      <SettingRow label="Google Meet link" description="Add a video link to meetings the assistant creates.">
        <Controller
          control={control}
          name="meeting.add_video_link"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Add Google Meet link"
            />
          )}
        />
      </SettingRow>
    </>
  );
}
