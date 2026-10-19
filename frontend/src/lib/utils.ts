import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatColor(value: number, max: number = 100): string {
  const ratio = value / max;
  if (ratio > 0.7) return "bg-emerald-500";
  if (ratio > 0.4) return "bg-amber-500";
  return "bg-rose-500";
}

export function formatSlotLabel(slot: string): string {
  switch (slot) {
    case "morning":
      return "上午時段";
    case "afternoon":
      return "下午時段";
    case "evening":
      return "晚間社課";
    default:
      return slot;
  }
}
