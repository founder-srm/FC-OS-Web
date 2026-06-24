import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const leadershipRoles = new Set([
  "president",
  "vice president",
  "human resource manager",
]);
