"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, endOfDay, format, startOfDay } from "date-fns";

type DatePickerWithPresetsProps = {
  className?: string;
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
};

export function DatePickerWithPresets({
  className,
  value,
  onChange,
}: DatePickerWithPresetsProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const today = startOfDay(new Date());
  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const presets: { label: string; range: DateRange }[] = [
    {
      label: "Today",
      range: {
        from: today,
        to: endOfDay(today),
      },
    },
    {
      label: "7 Days",
      range: {
        from: today,
        to: endOfDay(addDays(today, 6)),
      },
    },
    {
      label: "2 Weeks",
      range: {
        from: today,
        to: endOfDay(addDays(today, 13)),
      },
    },
    {
      label: "A Month",
      range: {
        from: today,
        to: endOfDay(addDays(today, 29)),
      },
    },
    {
      label: "3 Months",
      range: {
        from: today,
        to: endOfDay(addDays(today, 89)),
      },
    },
    {
      label: "6 Months",
      range: {
        from: today,
        to: endOfDay(addDays(today, 179)),
      },
    },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              "h-8 border-none bg-transparent text-xs text-neutral-500 ring-1 ring-neutral-700 hover:bg-transparent dark:bg-foundation-blue-700 dark:text-neutral-100",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[520px] p-4" align="start">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="secondary"
                size="sm"
                onClick={() => handleSelect(preset.range)}
                className="rounded-sm px-2 py-1 text-xs font-normal text-neutral-500 ring-1 ring-neutral-300 hover:bg-neutral-100 dark:bg-foundation-blue-900 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-foundation-blue-900/50"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date < today}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
