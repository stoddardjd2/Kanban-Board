import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; dot: string }
> = {
  LOW: {
    label: "Low",
    color: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  HIGH: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  URGENT: {
    label: "Urgent",
    color: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
