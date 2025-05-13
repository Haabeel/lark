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
  className?: string;
  hideAvatar?: boolean;
  label?: string;
  contentClassName?: string;
}

export function Combobox({
  items,
  value,
  expanded,
  onChangeAction,
  className,
  hideAvatar,
  label,
  contentClassName,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          aria-expanded={open}
          className={cn(
            `dark:border-1 flex h-full w-full items-center ${expanded ? "justify-between" : "justify-center"} rounded-md border-none bg-sidebar p-4 shadow-none hover:bg-sidebar/50 dark:bg-foundation-blue-700 dark:text-neutral-100 dark:hover:bg-foundation-blue-700/50`,
            className,
          )}
        >
          <div className={`flex items-center justify-between gap-2`}>
            {!hideAvatar &&
              (value ? (
                <Avatar
                  name={
                    value
                      ? items.find((item) => item.value === value)?.label
                      : ""
                  }
                  className={`${expanded ? "size-6" : "size-5"} rounded-sm ${!expanded && "text-xs"} transition-all duration-200 ease-linear`}
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
              ))}
            {expanded && (
              <p>
                {value && value !== ""
                  ? items.find((item) => item.value === value)?.label
                  : (label ?? "Select Project")}
              </p>
            )}
          </div>
          {expanded && <ChevronsUpDown className="opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-full min-w-56 px-4 py-2 dark:border-none dark:bg-foundation-blue-900",
          contentClassName,
        )}
      >
        <Command className="dark:bg-foundation-blue-900">
          {items.length > 4 && (
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
                  className="cursor-pointer text-xs hover:bg-foundation-neutral-400 dark:bg-foundation-blue-900 dark:text-neutral-100 dark:hover:bg-foundation-blue-700"
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
