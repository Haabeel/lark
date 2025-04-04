"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Avatar from "./initials-avatar";

interface ComboboxProps {
  items: { value: string; label: string }[];
  value: string;
  onChangeAction: (value: string) => void;
}

export function Combobox({ items, value, onChangeAction }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex h-full w-full items-center justify-between rounded-none border-none px-6 py-5 shadow-none"
        >
          <div className="flex items-center justify-between gap-2">
            <Avatar
              name={
                value ? items.find((item) => item.value === value)?.label : ""
              }
              className="size-6 rounded-sm"
            />
            <p>
              {value
                ? items.find((item) => item.value === value)?.label
                : "Select Project"}
            </p>
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search a Project" className="h-9" />
          <CommandList>
            <CommandEmpty>No Project Found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onChangeAction(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
