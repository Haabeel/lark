"use client";

import * as React from "react";
import { Check, ChevronsUpDown, FolderGit2 } from "lucide-react";
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
import Link from "next/link";

interface ComboboxProps {
  items: { value: string; label: string; backgroundColor?: string }[];
  value: string;
  expanded?: boolean;
  onChangeAction: (value: string) => void;
}

export function Combobox({
  items,
  value,
  expanded,
  onChangeAction,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  console.log(value, "value in combobox");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="dark:border-1 flex h-full w-full items-center justify-between rounded-md border-none p-4 shadow-none dark:bg-foundation-blue-700 dark:text-neutral-100 dark:hover:bg-foundation-blue-700/50"
        >
          <div className="flex items-center justify-between gap-2">
            {value ? (
              <Avatar
                name={
                  value ? items.find((item) => item.value === value)?.label : ""
                }
                className="size-6 rounded-sm"
                backgroundColor={
                  value
                    ? items.find((item) => item.value === value)
                        ?.backgroundColor
                    : undefined
                }
              />
            ) : (
              <FolderGit2
                className="text-neutral-100"
                style={{ width: "22px", height: "22px" }}
              />
            )}
            {expanded && (
              <p>
                {value
                  ? items.find((item) => item.value === value)?.label
                  : "Select Project"}
              </p>
            )}
          </div>
          {expanded && <ChevronsUpDown className="opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-56 px-4 py-2 dark:border-none dark:bg-foundation-blue-900">
        <Command className="dark:bg-foundation-blue-900">
          {items.length > 0 && (
            <CommandInput
              placeholder="Search a Project"
              className="h-9 dark:text-neutral-100 dark:placeholder:text-neutral-300"
            />
          )}
          <CommandList className="dark:bg-foundation-blue-900 dark:text-neutral-100">
            <CommandEmpty className="flex flex-col items-center justify-center gap-2">
              <p className="text-sm">No Projects Found.</p>
              <Link
                href={"/create-project"}
                className="rounded-sm bg-slate-600 px-2 py-1 text-white"
              >
                Create Project
              </Link>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  className="cursor-pointer dark:bg-foundation-blue-900 dark:text-neutral-100"
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
