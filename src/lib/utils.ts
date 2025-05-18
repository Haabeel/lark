import { type api } from "@/trpc/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createBackgroundHue() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 40%)`;
}

export function initials(name: string) {
  if (!name) return "";
  const words = name.split(" ").filter(Boolean);
  if (words.length >= 2) {
    const firstLetter = words[0]?.[0] ?? "";
    const secondLetter = words[1]?.[0] ?? "";
    return (firstLetter + secondLetter).toUpperCase();
  } else if (words.length === 1) {
    return words[0]?.[0]?.toUpperCase() ?? "";
  }
  return "";
}
